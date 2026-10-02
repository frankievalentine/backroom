/**
 * Sponsored placements on the home page. This file is the whole CMS.
 *
 * Every placement is paid and every card carries a Sponsored badge. There is no
 * `kind` field, so a store cannot appear unlabelled and read as an editorial
 * recommendation, which this product has no honest process to back.
 *
 * `status` starts at "placeholder" and flips to "live" when a real deal starts.
 * `endsAt` retires an entry without a follow-up change.
 */

export type FeaturedStatus = "placeholder" | "live"

export type FeaturedPlacement = {
  id: string
  status: FeaturedStatus
  /** Storefront the placement links to, so clicking loads real products. */
  domain: string
  name: string
  headline: string
  description: string
  /** ISO date the placement lapses. Omit for one with no end date. */
  endsAt?: string
}

/** Empty until a real deal is signed. */
export const FEATURED_PLACEMENTS: readonly FeaturedPlacement[] = []

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

/** The lead slot gets the largest treatment; the first entry wins. */
export const getHeroPlacement = (
  now: number = Date.now()
): FeaturedPlacement | null => getFeaturedPlacements(now)[0] ?? null

export const getSupportingPlacements = (
  now: number = Date.now()
): FeaturedPlacement[] => {
  const hero = getHeroPlacement(now)

  return getFeaturedPlacements(now).filter(
    (placement) => placement.id !== hero?.id
  )
}
