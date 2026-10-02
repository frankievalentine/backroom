import { cache } from "react"

import { normalizeDomain } from "@/lib/domain"
import type { ShopifyProduct } from "@/lib/shopify"
import {
  detectWebsiteType,
  fetchGenericProducts,
  fetchShopifyProducts,
  type WebsiteType,
} from "@/lib/website-detector"

/**
 * Server-side store reads.
 *
 * This is the module the App Router route calls directly, replacing the old
 * path where the client POSTed to /api/scrape from a useEffect. That path could
 * not stream: the fetch only started after hydration, and every product crossed
 * the wire as client JavaScript before the Suspense fallback had anything to
 * wait on.
 *
 * Called from a server component, the promise is handed to a client component
 * that unwraps it with `use()`. The shell paints immediately and the products
 * stream in when the read resolves, which is the pattern the App Router docs
 * prescribe for slow data.
 *
 * `cache` is React's request-scoped memo, not a shared store. It exists to stop
 * two components in the same render from walking the same store twice. It is
 * discarded when the request ends and gives no cross-user reuse -- the durable
 * options are `use cache` for a Next-managed store or your own Redis.
 */

export type StoreReadSuccess = {
  ok: true
  /** Canonical domain. Always trust this over whatever the user typed. */
  domain: string
  products: ShopifyProduct[]
  websiteType: WebsiteType
  truncated: boolean
}

export type StoreReadFailure = {
  ok: false
  /** Canonical domain when the input was normalisable, otherwise null. */
  domain: string | null
  error: string
}

export type StoreReadResult = StoreReadSuccess | StoreReadFailure

/**
 * Normalise without doing any network work.
 *
 * Exported separately so the route can decide whether to start a read at all
 * before spending anything, and so a malformed input fails fast in the server
 * component rather than suspending on a promise that will only ever resolve to
 * an error.
 */
export const readDomain = normalizeDomain

export const readStore = cache(
  async (input: string): Promise<StoreReadResult> => {
    const normalized = normalizeDomain(input)

    if (!normalized.ok) {
      return { ok: false, domain: null, error: normalized.reason }
    }

    const { domain } = normalized

    try {
      const websiteType = await detectWebsiteType(domain)

      if (websiteType !== "shopify") {
        return {
          ok: false,
          domain,
          error: `${domain} does not look like a Shopify store.`,
        }
      }

      const { products, truncated } = await fetchShopifyProducts(domain)

      return { ok: true, domain, products, websiteType, truncated }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch products."

      return { ok: false, domain, error: message }
    }
  }
)

export { fetchGenericProducts }
