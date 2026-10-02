/**
 * Legal document constants.
 *
 * Contact address and sender live here so the policy, the terms, the footer and
 * the form cannot drift apart.
 */

/**
 * Where requests are delivered.
 *
 * The fallback is deliberately unroutable: a real one would let unsetting the
 * Vercel var silently send every takedown request nowhere.
 */
export const CONTACT_EMAIL =
  process.env.CONTACT_EMAIL ?? "unset-in-config@invalid.example"

/** Verified Resend sender, e.g. "Backroom <noreply@yourdomain.com>". */
export const RESEND_FROM =
  process.env.RESEND_FROM ?? "Backroom <onboarding@resend.dev>"

export const PRIVACY_EFFECTIVE_DATE = "1 October 2026"

export const TERMS_EFFECTIVE_DATE = "1 October 2026"

/**
 * Whether the sender names an address Resend can send from.
 *
 * Rejects `*.vercel.app` because its DNS is not the account owner's to verify.
 * Real domains pass on the assumption they are verified, which we cannot check.
 */
const SENDER_PATTERNS = [
  /<([^<>\s]+@[A-Za-z0-9.-]+)>/, // "Backroom <legal@yourdomain.com>"
  /^\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+)\s*$/, // "legal@yourdomain.com"
]

export const isValidSender = (from: string): boolean => {
  const match = SENDER_PATTERNS.map((pattern) => from.match(pattern)).find(
    (result): result is RegExpMatchArray => result !== null
  )

  if (!match) return false

  const domain = match[1].split("@")[1]?.toLowerCase() ?? ""

  return !domain.endsWith("vercel.app")
}

/**
 * Whether the form can deliver, checked before it renders.
 *
 * Catches a missing key, Resend's shared onboarding address, and a bad sender. It
 * cannot catch an invalid key, only an absent one, so a form can still appear and
 * then fail with a 502.
 */
export const isContactConfigured = (): boolean =>
  Boolean(process.env.RESEND_API_KEY) &&
  !RESEND_FROM.includes("onboarding@resend.dev") &&
  isValidSender(RESEND_FROM)

/**
 * Footer disclaimer. The no-endorsement clause does the real work: naming a brand
 * to say whose store it is is fine, and the risk is a reader inferring a
 * relationship. The precise version is on the terms page.
 */
export const AFFILIATION_DISCLAIMER =
  "Backroom is an independent storefront exploration tool. It is not affiliated with, endorsed by, or sponsored by Shopify or any merchant displayed here. Brand names, product information, and imagery belong to their respective owners."
