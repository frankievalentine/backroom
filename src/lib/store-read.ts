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
 * Called by the App Router route directly, so the promise can be handed to a
 * client component that unwraps it with `use()`: the shell paints immediately
 * and products stream in when the read resolves. The old client-POST path could
 * not stream, because the fetch only started after hydration.
 *
 * `cache` is React's request-scoped memo, not a shared store. It stops one
 * render walking the same store twice and gives no cross-user reuse.
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
 * Normalise with no network work, so the route can decide whether to start a
 * read at all and a bad input fails before anything is awaited.
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
