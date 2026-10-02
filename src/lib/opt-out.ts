/**
 * Storefronts that have asked not to be explored.
 *
 * A merchant or their legal team can request removal, and the sensible response
 * is to remove the domain rather than argue about it. That is the whole point of
 * this list: it turns an argument into a one-line pull request.
 *
 * Adding a domain here is the entire opt-out process. It takes effect on the
 * next deploy, which is why this is a checked-in file rather than something
 * editable at runtime -- a takedown that requires a deploy is fast enough, and a
 * list that could be edited by anyone with a binding is a much bigger problem.
 *
 * Remove an entry only at the domain owner's request. The list is not a
 * competitive ranking and nothing here should be added for any other reason.
 */
export const OPTED_OUT_DOMAINS: readonly string[] = []

/**
 * Whether a merchant has asked for their storefront to be left alone.
 *
 * Exact match only. A suffix match would also block every subdomain of a
 * blocked domain, and a merchant on `shop.example.com` is not the same party as
 * one on `example.com` -- blocking the parent would take out unrelated stores
 * nobody asked us to touch.
 */
export const isOptedOut = (domain: string): boolean =>
  OPTED_OUT_DOMAINS.includes(domain.toLowerCase())

/** Shown to the user when a domain is blocked. */
export const OPTED_OUT_MESSAGE =
  "This storefront is unavailable through Backroom at the merchant's request."
