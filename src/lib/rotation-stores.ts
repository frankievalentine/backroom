/**
 * Stores offered by the hero call to action.
 *
 * Deliberately disjoint from `POPULAR_SITES`. The two lists sit a few hundred
 * pixels apart on the same page, so reusing names would make the rotation look
 * like a bug rather than a choice: a visitor clicking through the popular grid
 * would meet the same stores again in the button. A separate set also widens the
 * range of catalogs a visitor can reach from the first screen.
 *
 * Every domain here was verified on ROTATION_VERIFIED_ON by requesting
 * `/products.json?limit=250&page=1` and checking that the response parsed and
 * that the products belonged to the named brand. That check earned its keep twice
 * in one round: `uncrate.com` was proposed first and is genuinely dead, its
 * storefront loads but its `/products.json` returns 404. The working storefront
 * is `shop.uncrate.com`, a subdomain serving a marketplace of other people's
 * brands. Both facts are recorded below so neither is re-litigated.
 *
 * The rest rejected in the same round: `caraway.co`, `hedleyandhennett.com`,
 * `baeswax.com`, `hookandbullet.com`, `skinnydip.com`, `copperandkube.com` and
 * `humbeand.com` did not answer at all, `mizzenandmain.com` returned 429,
 * `leisuregoods.com` returned 403, and `baggu.com`, `twee.com` and
 * `factorybrand.com` returned 404. A list built from brand names alone sends
 * people to dead ends.
 *
 * `catalogSize` is the first page's product count, not a full walk. `melin.com`,
 * `boggbag.com` and `shop.uncrate.com` all hit the 250 page cap, so theirs is a
 * floor. The figure is never displayed, so an approximate value is honest here.
 *
 * Re-verify before trusting any of this. Stores move, block bots, or change
 * platform, and a hero call to action that lands on an error is worse than no
 * call to action at all.
 */
export const ROTATION_VERIFIED_ON = "2026-10-01"

export type RotationStore = {
  /** Canonical hostname, as the scraper normalises and stores it. */
  domain: string
  name: string
  /** Products on page one. Not a total; see the note above. */
  catalogSize: number
  /** True when page one filled the 250 cap, so `catalogSize` is a floor. */
  catalogIsFloor?: boolean
  /** True when the storefront carries many brands rather than one. */
  isMultiBrand?: boolean
}

/**
 * Ordered so the first entry is the one shown before hydration settles.
 *
 * The rotation starts here and does not begin until after mount, so this is what
 * the server renders and what a visitor sees on first paint. Graza leads because
 * it is the most distinctive of the set: an olive oil brand is not what anyone
 * expects a catalog browser to contain, which is the entire argument for
 * rotating rather than listing.
 *
 * Spans five categories on purpose, apparel, accessories, candles, eyewear and
 * bags, so consecutive flips do not look like the same store twice.
 */
export const ROTATION_STORES: readonly RotationStore[] = [
  {
    domain: "graza.co",
    name: "Graza",
    catalogSize: 80,
  },
  {
    domain: "alpakagear.com",
    name: "Alpaka",
    catalogSize: 135,
  },
  {
    domain: "pfcandleco.com",
    name: "P.F. Candle Co.",
    catalogSize: 87,
  },
  {
    domain: "shop.uncrate.com",
    name: "Uncrate",
    catalogSize: 250,
    /** Page cap reached, so the real catalog is larger. */
    catalogIsFloor: true,
    /**
     * A multi-brand marketplace rather than a single store: 63 distinct vendors
     * on page one alone, from Billy Reid to Carl Friedrik. Worth keeping in the
     * rotation precisely because it is the one entry where the brand filter has
     * real work to do.
     */
    isMultiBrand: true,
  },
  {
    domain: "melin.com",
    name: "Melin",
    catalogSize: 250,
    /** Page cap reached, so the real catalog is larger. */
    catalogIsFloor: true,
  },
  {
    domain: "boggbag.com",
    name: "Bogg Bag",
    catalogSize: 250,
    /** Page cap reached, so the real catalog is larger. */
    catalogIsFloor: true,
  },
]

export const ROTATION_INTERVAL_MS = 4000
