import { type NextRequest, NextResponse } from "next/server"

import { normalizeDomain } from "@/lib/domain"
import type { ShopifyProduct } from "@/lib/shopify"
import {
  detectWebsiteType,
  fetchGenericProducts,
  fetchShopifyProducts,
  type WebsiteType,
} from "@/lib/website-detector"

/**
 * No `runtime` export.
 *
 * This handler used to pin `runtime = "nodejs"`, which it did not need: the
 * only thing reaching the outside world is `fetch`, and every helper it calls
 * uses Web-standard APIs and nothing else. There is no `fs`, no `Buffer`, no
 * Node built-in anywhere in the import graph.
 *
 * The pin was a problem for Cloudflare Workers, which has no Node runtime at
 * all. vinext documents that `runtime` does not choose where a route executes
 * -- that belongs to the deployment adapter -- so leaving it in place would
 * have been a false statement about where this code runs, on any platform.
 */

const CACHE_TTL_MS = 5 * 60 * 1000
const MAX_CACHE_ENTRIES = 200

type CacheEntry = {
  products: ShopifyProduct[]
  websiteType: WebsiteType
  truncated: boolean
  expiresAt: number
}

/**
 * In-process cache.
 *
 * Note this is per-instance and best-effort: it will not survive across serverless
 * instances and gives no cross-user consistency. It exists to stop one user
 * hammering the same store within a session, nothing more. Swap for Redis or
 * Next's data cache before relying on it at scale.
 */
const cache = new Map<string, CacheEntry>()

const readCache = (key: string): CacheEntry | null => {
  const entry = cache.get(key)

  if (!entry) return null

  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }

  return entry
}

const writeCache = (
  key: string,
  entry: Omit<CacheEntry, "expiresAt">
): void => {
  // Simple bound so a crawl of thousands of domains cannot exhaust memory.
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value

    if (oldestKey) cache.delete(oldestKey)
  }

  cache.set(key, { ...entry, expiresAt: Date.now() + CACHE_TTL_MS })
}

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status })

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return errorResponse("Request body must be valid JSON.", 400)
  }

  const rawDomain =
    body && typeof body === "object" && "domain" in body
      ? (body as { domain: unknown }).domain
      : null

  if (typeof rawDomain !== "string") {
    return errorResponse("Domain is required.", 400)
  }

  // Normalising server-side is what guarantees the client stores one canonical
  // value per store, so duplicates and malformed product URLs cannot reappear.
  const normalized = normalizeDomain(rawDomain)

  if (!normalized.ok) {
    // 451 rather than 400 for a merchant opt-out. The request was well formed
    // and we are declining it for policy reasons, which is exactly what 451 is
    // for, and it keeps the two cases distinguishable in logs: a 400 here is
    // somebody typing a bad domain, a 451 is a documented request from a
    // merchant.
    return errorResponse(normalized.reason, normalized.optedOut ? 451 : 400)
  }

  const { domain } = normalized
  const cacheKey = `products:${domain}`

  const cached = readCache(cacheKey)

  if (cached) {
    return NextResponse.json({
      domain,
      products: cached.products,
      count: cached.products.length,
      websiteType: cached.websiteType,
      truncated: cached.truncated,
      cached: true,
    })
  }

  try {
    const websiteType = await detectWebsiteType(domain)
    const { products, truncated } =
      websiteType === "shopify"
        ? await fetchShopifyProducts(domain)
        : await fetchGenericProducts(domain)

    writeCache(cacheKey, { products, websiteType, truncated })

    if (websiteType !== "shopify") {
      return NextResponse.json(
        {
          domain,
          products: [],
          count: 0,
          websiteType,
          truncated: false,
          cached: false,
          error: `${domain} does not look like a Shopify store.`,
        },
        { status: 422 }
      )
    }

    return NextResponse.json({
      domain,
      products,
      count: products.length,
      websiteType,
      truncated,
      cached: false,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch products."

    return errorResponse(message, 502)
  }
}
