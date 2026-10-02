import { type NextRequest, NextResponse } from "next/server"

import { normalizeDomain } from "@/lib/domain"
import type { ShopifyProduct } from "@/lib/shopify"
import {
  detectWebsiteType,
  fetchGenericProducts,
  fetchShopifyProducts,
  type WebsiteType,
} from "@/lib/website-detector"

/*
  No `runtime` export. This handler used to pin `runtime = "nodejs"` without
  needing it: the only thing reaching the outside world is `fetch`, and every
  helper it calls is Web-standard. No `fs`, no `Buffer`, no Node built-in anywhere
  in the import graph.

  The pin also blocked Cloudflare Workers, which has no Node runtime. vinext
  documents that `runtime` does not choose where a route executes -- that
  belongs to the deployment adapter -- so leaving it in would have been a false
  statement about where this code runs, on any platform.
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
 * In-process cache. Per-instance and best-effort: it does not survive across
 * serverless instances and gives no cross-user consistency. It stops one user
 * hammering the same store within a session, nothing more. Swap for a shared
 * cache before relying on it at scale.
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

  // Normalised server-side, so the client stores one canonical value per store
  // and duplicates or malformed product URLs cannot reappear.
  const normalized = normalizeDomain(rawDomain)

  if (!normalized.ok) {
    // 451 rather than 400 for an opt-out: the request was well formed and we are
    // declining for policy, which is what 451 is for. It also keeps the cases
    // distinguishable in logs -- 400 is a typo, 451 is a merchant request.
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
