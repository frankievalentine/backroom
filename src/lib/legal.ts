/**
 * Legal document constants.
 *
 * The contact address is a single constant so the privacy policy, the terms and
 * the footer cannot drift to different addresses. A takedown request sent to an
 * address nobody reads is worse than having no address at all, because it implies
 * a process that does not exist -- so point this at a real monitored mailbox.
 */
export const LEGAL_CONTACT = "legal@trybackroom.com"

export const PRIVACY_EFFECTIVE_DATE = "1 October 2026"

export const TERMS_EFFECTIVE_DATE = "1 October 2026"

/**
 * Footer disclaimer.
 *
 * Kept short because a footer is not read closely, and a paragraph nobody reads
 * protects nothing. The precise version lives on the terms page, which is linked
 * directly beneath it.
 *
 * The clause that does the real work is the one denying endorsement: naming a
 * brand to say whose store it is is nominative use, and the risk is that a reader
 * infers a relationship. Saying plainly that none exists is what prevents that
 * inference.
 */
export const AFFILIATION_DISCLAIMER =
  "Backroom is an independent storefront exploration tool. It is not affiliated with, endorsed by, or sponsored by Shopify or any merchant displayed here. Brand names, product information, and imagery belong to their respective owners."
