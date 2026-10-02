/**
 * Domain handling for user-supplied store URLs.
 *
 * Every stored domain is normalised here so "https://www.Allbirds.com/",
 * "allbirds.com" and "ALLBIRDS.COM" collapse to one value, which keeps the
 * saved-sites list free of duplicates and makes product URLs safe to build.
 *
 * This is also the single gate every outbound request passes through, so SSRF
 * blocking and merchant opt-outs both live here rather than at the call sites.
 * A filter that has to be remembered at each fetch site is one that eventually
 * gets missed at a few of them.
 */

import { isOptedOut, OPTED_OUT_MESSAGE } from "@/lib/opt-out"

const DOMAIN_PATTERN =
  /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i

/** Hostnames that must never be fetched, to block SSRF against the deployment. */
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "instance-data",
])

/** Hosts that resolve inside the deployment's own network. */
const BLOCKED_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".localdomain",
]

export type NormalizeResult =
  | { ok: true; domain: string }
  /**
   * `optedOut` is separate from `blocked` on purpose. A blocked host is never
   * fetched for security reasons and the user should not learn why; an opted-out
   * host is a merchant exercising a documented request, and says so.
   */
  | { ok: false; reason: string; optedOut?: boolean }

/**
 * Strip protocol, credentials, `www.`, paths, ports and trailing dots, then
 * validate as a plausible public hostname.
 *
 * Returns a discriminated result rather than a bare string so callers must
 * handle the invalid case.
 */
export const normalizeDomain = (input: string): NormalizeResult => {
  const trimmed = input.trim()

  if (!trimmed) {
    return { ok: false, reason: "Enter a domain." }
  }

  // Accept bare hosts as well as full URLs. Any other scheme is rejected
  // outright rather than silently coerced.
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`

  let url: URL

  try {
    url = new URL(candidate)
  } catch {
    return { ok: false, reason: `"${trimmed}" is not a valid URL.` }
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, reason: "Only http and https URLs are supported." }
  }

  if (url.username || url.password) {
    return { ok: false, reason: "Credentials in the URL are not supported." }
  }

  const hostname = url.hostname
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\.$/, "")

  if (!DOMAIN_PATTERN.test(hostname)) {
    return { ok: false, reason: `"${hostname}" is not a valid domain.` }
  }

  if (isBlockedHostname(hostname)) {
    return { ok: false, reason: "That host cannot be explored." }
  }

  // Last, and only once canonical, so a takedown entry is written the way a user
  // would type it.
  if (isOptedOut(hostname)) {
    return { ok: false, reason: OPTED_OUT_MESSAGE, optedOut: true }
  }

  return { ok: true, domain: hostname }
}

/** Guard against requests aimed at loopback, link-local and RFC1918 space. */
export const isBlockedHostname = (hostname: string): boolean => {
  if (BLOCKED_HOSTNAMES.has(hostname)) return true
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix)))
    return true

  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)

  if (ipv4) {
    const [a, b] = ipv4.slice(1).map(Number)

    if (a === 0 || a === 10 || a === 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true

    return true
  }

  // Any IPv6 literal is refused; we only ever want public DNS names.
  if (hostname.includes(":")) return true

  return false
}

/** Build the canonical public product URL for a scraped product. */
export const buildProductUrl = (
  domain: string,
  handle: string
): string | null => {
  if (!handle) return null

  return `https://${domain}/products/${encodeURIComponent(handle)}`
}
