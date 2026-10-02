/**
 * Curated ranking of Shopify storefronts on the home page. Ordering is editorial,
 * not measured traffic rank.
 *
 * Every domain was verified to serve a parseable `/products.json` whose first
 * product belongs to that brand. That check matters: `shopify.com` and
 * `peloton.com` 404 on products.json, and `ridge.com`, `warbyparker.com` and
 * `bombas.com` answer 403 or 429. A list built from brand names alone sends
 * users to dead ends.
 *
 * `products` was measured on VERIFIED_ON with this app's own scrape, so the
 * numbers match what a user sees. `productsAreFloor` means the walk hit the
 * 5,000-product cap, so the real catalog is larger. Counts drift: re-run before
 * trusting them and drop any store that stops serving products.json.
 */
export const VERIFIED_ON = "2026-10-01"

export type PopularSite = {
  /** Canonical hostname, exactly as the scraper normalises and stores it. */
  domain: string
  name: string
  /** What the store sells, one short phrase. */
  category: string
  /** Measured catalog size, rounded down to the nearest hundred. */
  products: number
  /** True when measurement stopped at the cap, so `products` is a lower bound. */
  productsAreFloor: boolean
}

export const POPULAR_SITES: readonly PopularSite[] = [
  {
    domain: "gymshark.com",
    name: "Gymshark",
    category: "Activewear",
    products: 5000,
    productsAreFloor: true,
  },
  {
    domain: "everlane.com",
    name: "Everlane",
    category: "Apparel",
    products: 5000,
    productsAreFloor: true,
  },
  {
    domain: "taylorstitch.com",
    name: "Taylor Stitch",
    category: "Apparel",
    products: 3800,
    productsAreFloor: false,
  },
  {
    domain: "nixon.com",
    name: "Nixon",
    category: "Watches",
    products: 1400,
    productsAreFloor: false,
  },
  {
    domain: "awaytravel.com",
    name: "Away",
    category: "Luggage",
    products: 1100,
    productsAreFloor: false,
  },
  {
    domain: "cuyana.com",
    name: "Cuyana",
    category: "Leather goods",
    products: 900,
    productsAreFloor: false,
  },
  {
    domain: "allbirds.com",
    name: "Allbirds",
    category: "Footwear",
    products: 600,
    productsAreFloor: false,
  },
  {
    domain: "outdoorresearch.com",
    name: "Outdoor Research",
    category: "Outdoor gear",
    products: 500,
    productsAreFloor: false,
  },
]

/** Capped so the grid stays scannable and the page stays fast. */
export const POPULAR_SITE_LIMIT = 8

export const getPopularSites = (limit = POPULAR_SITE_LIMIT): PopularSite[] =>
  POPULAR_SITES.slice(0, limit)

/** Human-readable catalog size, e.g. "1.4k products" or "5k+ products". */
export const formatCatalogSize = (site: PopularSite): string => {
  const { products, productsAreFloor } = site

  const formatted =
    products >= 1000
      ? `${(products / 1000).toFixed(1).replace(/\.0$/, "")}k`
      : `${products}`

  return `${formatted}${productsAreFloor ? "+" : ""} products`
}
