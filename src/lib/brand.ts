/**
 * Brand constants.
 *
 * The product has a brand name and a descriptor, and they do different jobs.
 * "Backroom" is the identity; "a storefront explorer" says what it does. Keeping
 * them here rather than inline means the wordmark, page titles, the compact
 * sidebar badge and the footer cannot drift apart.
 *
 * The previous name was "Product Scraper", which oversold the tool: it
 * promised extraction, and there is no export. The catalog is the thing being
 * shown, which is what the name now says.
 */

/** Full product name. Used in the wordmark and page titles. */
export const BRAND_NAME = "Backroom"

/** One-line description of what the product is. */
export const BRAND_DESCRIPTOR = "A storefront explorer"

/** Longer form for metadata and the footer. */
export const BRAND_TAGLINE =
  "Browse any Shopify store's full product catalog. Filter by vendor, type, tag and price."

/** The tool route. Was `/scraper`; `/scraper` redirects here. */
export const TOOL_ROUTE = "/backroom"
