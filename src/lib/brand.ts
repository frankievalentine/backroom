/**
 * Brand constants.
 *
 * Kept in one place so the wordmark, page titles, sidebar badge and footer cannot
 * drift apart.
 */

/** Full product name. Used in the wordmark and page titles. */
export const BRAND_NAME = "Backroom"

/** One-line description of what the product is. */
export const BRAND_DESCRIPTOR = "A storefront explorer"

/** Metadata and footer copy. Says "a store", not "any": some stores block us. */
export const BRAND_TAGLINE =
  "Browse a Shopify store's full product catalog. Filter by vendor, type, tag and price."

/** Environment variable used to configure the canonical deployment origin. */
export const SITE_URL_ENV = "NEXT_PUBLIC_SITE_URL"

/** Safe deployment hostname used until a custom domain is configured. */
export const SITE_URL_FALLBACK = "https://trybackroom.vercel.app"

/**
 * Public site URL used by metadata and crawler-facing routes.
 *
 * Validate the environment value during module initialization so malformed or
 * non-HTTPS deployment configuration cannot break a production build.
 */
function getSiteUrl() {
  const candidate = process.env[SITE_URL_ENV]

  if (candidate) {
    try {
      const parsed = new URL(candidate)
      if (parsed.protocol === "https:")
        return parsed.toString().replace(/\/$/, "")
    } catch {
      // Fall through to the known-good deployment hostname.
    }
  }

  return SITE_URL_FALLBACK
}

export const SITE_URL = getSiteUrl()

/** The tool route. Was `/scraper`; `/scraper` redirects here. */
export const TOOL_ROUTE = "/backroom"

/** Source repository, linked from the footer. */
export const REPOSITORY_URL = "https://github.com/frankievalentine/backroom"
