/**
 * Featured and sponsored placements on the home page.
 *
 * This file is the whole CMS. Adding a placement means editing it here and
 * opening a pull request.
 *
 * Two rules the data model enforces:
 *
 *  1. A paid placement must be labelled. `kind: "sponsored"` always renders a
 *     visible "Sponsored" badge, because an unmarked paid placement reads as an
 *     editorial recommendation.
 *
 *  2. Nothing may claim to be sponsored unless it is. Seeded entries ship with
 *     `status: "placeholder"`, which renders as "Sample placement" instead.
 *     Set `status: "live"` on an entry at the moment a real deal starts, and
 *     set an `endsAt` ISO date so it retires itself without a follow-up change.
 */

/**
 * Whether the home page renders the Featured stores section at all.
 *
 * Off while there is nothing real to show. The four entries below are seed data
 * with `status: "placeholder"`, so they render as "Sample placement" rather than
 * as a real recommendation or a real deal. A carousel of samples reads as filler
 * and undercuts the credibility of the rest of the page.
 *
 * The section, its component and the data all stay in place, so turning it back
 * on is a one-word change here. It comes back automatically once a placement is
 * genuinely live: set `status: "live"` on an entry and flip this to true.
 */
export const SHOW_FEATURED_SECTION = false

export type FeaturedKind = "featured" | "sponsored"

export type FeaturedStatus = "placeholder" | "live"

export type FeaturedPlacement = {
  id: string
  kind: FeaturedKind
  status: FeaturedStatus
  /** Storefront the placement links to, so clicking loads real products. */
  domain: string
  name: string
  headline: string
  description: string
  /** ISO date the placement lapses. Omit for one with no end date. */
  endsAt?: string
}

/**
 * Seed placements. Every domain was verified to serve its own catalog; see
 * the note in popular-sites.ts for the storefronts that failed that check.
 */
export const FEATURED_PLACEMENTS: readonly FeaturedPlacement[] = [
  {
    id: "featured-taylor-stitch",
    kind: "featured",
    status: "placeholder",
    domain: "taylorstitch.com",
    name: "Taylor Stitch",
    headline: "Deep catalog, richly tagged",
    description:
      "Nearly four thousand products where vendor and type facets overlap heavily, which makes it a good stress test for filtering.",
  },
  {
    id: "sponsored-nixon",
    kind: "sponsored",
    status: "placeholder",
    domain: "nixon.com",
    name: "Nixon",
    headline: "Colourways multiply variants",
    description:
      "Each watch splits across dozens of strap and dial variants. A clean look at how variant handling scales.",
  },
  {
    id: "featured-cuyana",
    kind: "featured",
    status: "placeholder",
    domain: "cuyana.com",
    name: "Cuyana",
    headline: "Small catalog, high signal",
    description:
      "Around nine hundred products with consistent tags and imagery, which makes it a reliable end-to-end smoke test.",
  },
  {
    id: "sponsored-away",
    kind: "sponsored",
    status: "placeholder",
    domain: "awaytravel.com",
    name: "Away",
    headline: "Size and colour variant trees",
    description:
      "Luggage ranges split heavily across size and colour, so the variant count per product climbs quickly.",
  },
]

const isActive = (placement: FeaturedPlacement, now: number): boolean => {
  if (!placement.endsAt) return true

  const end = Date.parse(placement.endsAt)

  // An unparseable date is treated as expired rather than perpetual.
  return Number.isFinite(end) && end > now
}

export const getFeaturedPlacements = (
  now: number = Date.now()
): FeaturedPlacement[] =>
  FEATURED_PLACEMENTS.filter((placement) => isActive(placement, now))

/** The lead slot gets the largest treatment; the first live featured entry wins. */
export const getHeroPlacement = (
  now: number = Date.now()
): FeaturedPlacement | null => {
  const active = getFeaturedPlacements(now)

  return (
    active.find(
      (placement) =>
        placement.kind === "featured" && placement.status === "live"
    ) ??
    active.find((placement) => placement.kind === "featured") ??
    active[0] ??
    null
  )
}

export const getSupportingPlacements = (
  now: number = Date.now()
): FeaturedPlacement[] => {
  const hero = getHeroPlacement(now)

  return getFeaturedPlacements(now).filter(
    (placement) => placement.id !== hero?.id
  )
}
