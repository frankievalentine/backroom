const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify"

/** Verify a one-use Turnstile token before allowing a contact email to send. */
export const verifyTurnstileToken = async (
  token: unknown,
  remoteIp?: string
): Promise<boolean> => {
  const secret = process.env.TURNSTILE_SECRET_KEY
  const hostnames = (process.env.TURNSTILE_HOSTNAMES ?? "")
    .split(",")
    .map((hostname) => hostname.trim().toLowerCase())
    .filter(Boolean)

  if (!secret || hostnames.length === 0) return false
  if (typeof token !== "string" || token.length < 1 || token.length > 2048) {
    return false
  }

  try {
    const body = new URLSearchParams({ secret, response: token })
    if (remoteIp) body.set("remoteip", remoteIp)

    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) return false

    const result: unknown = await response.json()
    if (typeof result !== "object" || result === null) return false

    const verification = result as {
      success?: unknown
      action?: unknown
      hostname?: unknown
    }

    return (
      verification.success === true &&
      verification.action === "contact" &&
      typeof verification.hostname === "string" &&
      hostnames.includes(verification.hostname.toLowerCase())
    )
  } catch {
    return false
  }
}
