import { normalizeProducts, type ShopifyProduct } from "@/lib/shopify"

export type WebsiteType = "shopify" | "unknown"

export type ScrapeResult = {
  products: ShopifyProduct[]
  /** True when pagination stopped early because a page failed. */
  truncated: boolean
  pagesFetched: number
}

/** Caps pagination so a store always returning a full page cannot spin forever. */
const MAX_PAGES = 20
const PAGE_SIZE = 250
const DETECT_TIMEOUT_MS = 5000
const FETCH_TIMEOUT_MS = 10000

/**
 * Patterns that only appear on a real Shopify storefront.
 *
 * A bare /shopify/i is deliberately absent: it matches any page merely mentioning
 * the word, which produced false positives.
 */
const SHOPIFY_HTML_PATTERNS = [
  /cdn\.shopify\.com/i,
  /Shopify\.theme/i,
  /Shopify\.Analytics/i,
  /window\.Shopify\b/,
  /var\s+Shopify\s*=/,
  /shopify-section/i,
  /\/cdn\/shop\/files\//i,
]

const hasShopifyMarker = (html: string): boolean =>
  SHOPIFY_HTML_PATTERNS.some((pattern) => pattern.test(html))

/**
 * Whether a domain runs Shopify.
 *
 * `/products.json` is the reliable signal, so it is tried first with GET rather
 * than HEAD, which a number of stores reject outright. Only on failure do we scan
 * the homepage markup.
 */
export const detectWebsiteType = async (
  domain: string
): Promise<WebsiteType> => {
  try {
    const productsResponse = await fetch(
      `https://${domain}/products.json?limit=1`,
      {
        method: "GET",
        signal: AbortSignal.timeout(DETECT_TIMEOUT_MS),
        headers: { accept: "application/json" },
      }
    )

    if (productsResponse.ok) return "shopify"

    const homeResponse = await fetch(`https://${domain}`, {
      signal: AbortSignal.timeout(DETECT_TIMEOUT_MS),
      headers: {
        accept: "text/html",
        "user-agent": "Backroom/1.0 (+https://backroom.dev)",
      },
    })

    if (!homeResponse.ok) return "unknown"

    const html = await homeResponse.text()

    return hasShopifyMarker(html) ? "shopify" : "unknown"
  } catch {
    return "unknown"
  }
}

/**
 * Walk `/products.json` until a short page proves we are past the end.
 *
 * A failed page sets `truncated` rather than being swallowed, so the caller can
 * tell "this store has 40 products" from "we got 40 of 900".
 */
export const fetchShopifyProducts = async (
  domain: string
): Promise<ScrapeResult> => {
  const products: ShopifyProduct[] = []
  let truncated = false
  let pagesFetched = 0

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    try {
      const response = await fetch(
        `https://${domain}/products.json?limit=${PAGE_SIZE}&page=${page}`,
        {
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          headers: { accept: "application/json" },
        }
      )

      if (!response.ok) {
        // A 4xx past page 1 means we walked off the end, which is fine.
        if (page === 1) {
          throw new Error(`Store returned HTTP ${response.status}.`)
        }

        break
      }

      const data: unknown = await response.json()

      if (!data || typeof data !== "object") {
        truncated = page > 1
        break
      }

      const batch = normalizeProducts((data as { products?: unknown }).products)

      pagesFetched = page

      if (batch.length === 0) break

      products.push(...batch)

      if (batch.length < PAGE_SIZE) break
    } catch (error) {
      if (page === 1) throw error

      truncated = true
      break
    }
  }

  if (pagesFetched >= MAX_PAGES && products.length > 0) {
    truncated = true
  }

  return { products, truncated, pagesFetched }
}

/**
 * Non-Shopify stores are not supported. Returning empty rather than fabricating
 * keeps the UI honest about what it has.
 */
export const fetchGenericProducts = async (
  domain: string
): Promise<ScrapeResult> => {
  console.warn(`Generic scraping not implemented for ${domain}`)

  return { products: [], truncated: false, pagesFetched: 0 }
}
