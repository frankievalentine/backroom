/**
 * Legal document constants.
 *
 * The contact address and the sender identity live here rather than inline, so
 * the privacy policy, the terms, the footer and the form cannot drift apart. A
 * takedown request sent to an address nobody reads is worse than having no
 * address at all, because it implies a process that does not exist.
 *
 * `RESEND_FROM` must be a domain you have verified with Resend. An unverified
 * domain silently fails every send, so `isContactConfigured` treats a missing
 * from-address as unconfigured and the form says so rather than reporting
 * success and dropping the message.
 */

/** Where requests are delivered. Must be a mailbox you actually read. */
export const CONTACT_EMAIL =
  process.env.CONTACT_EMAIL ?? "frankievalentine@gmail.com"

/** Verified Resend sender, e.g. "Backroom <noreply@yourdomain.com>". */
export const RESEND_FROM =
  process.env.RESEND_FROM ?? "Backroom <onboarding@resend.dev>"

export const PRIVACY_EFFECTIVE_DATE = "1 October 2026"

export const TERMS_EFFECTIVE_DATE = "1 October 2026"

/**
 * Whether the sender string is one Resend will accept.
 *
 * Resend requires `Name <you@yourdomain.com>`. Two mistakes pass a naive
 * truthiness check and fail only at send time, and both happened: a bare address
 * with no display name, and a `*.vercel.app` host, which nobody can verify in a
 * Resend account because the DNS is not theirs to verify. Either one renders a
 * form that cannot deliver, which is the outcome this guard exists to prevent.
 *
 * The `vercel.app` exclusion is narrow on purpose. Resend's shared onboarding
 * address is handled separately by `isContactConfigured`, and any real custom
 * domain passes on the assumption it has been verified.
 */
const SENDER_PATTERN = /^\s*[^<>]*<\s*([^<>\s]+@[A-Za-z0-9.-]+)\s*>\s*$/

export const isValidSender = (from: string): boolean => {
  const match = from.match(SENDER_PATTERN)

  if (!match) return false

  const domain = match[1].split("@")[1]?.toLowerCase() ?? ""

  return !domain.endsWith("vercel.app")
}

/**
 * Whether the contact form can actually deliver.
 *
 * Checked before the form renders as well as before the route sends, so a
 * visitor is never shown a form that is going to fail. Returns false when the API
 * key is missing, when the sender is still Resend's shared onboarding address
 * (which only delivers to the account owner's own inbox), or when the sender is
 * malformed.
 *
 * This cannot detect an invalid API key, only an absent one. That limit is real
 * and worth stating: Resend rejects a bad key at send time, and the route turns
 * that into a logged 502. A form can therefore still appear and then fail, which
 * is why the send error tells the visitor to retry rather than claiming success.
 */
export const isContactConfigured = (): boolean =>
  Boolean(process.env.RESEND_API_KEY) &&
  !RESEND_FROM.includes("onboarding@resend.dev") &&
  isValidSender(RESEND_FROM)

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
