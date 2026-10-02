import { NextResponse } from "next/server"
import { Resend } from "resend"

import { contactSchema, firstFieldErrors } from "@/lib/contact"
import { CONTACT_EMAIL, isContactConfigured, RESEND_FROM } from "@/lib/legal"
import { verifyTurnstileToken } from "@/lib/turnstile"

/**
 * Merchant and rights-holder requests.
 *
 * A form rather than a `mailto:` on a domain that does not resolve, which was a
 * link that silently went nowhere while implying a monitored inbox. A form either
 * delivers or says it cannot.
 *
 * Safe to expose because it is rate limited per IP, and the visitor's address
 * goes in `replyTo` rather than as a sender, so nobody can send mail appearing to
 * come from us.
 */

/** Requests allowed per IP per hour. Comfortably above real takedown volume. */
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000

/**
 * Best-effort per-isolate rate limit. Same caveat as the scrape cache: it resets
 * when the isolate recycles, so a speed bump against casual misuse rather than a
 * guarantee. Enough here because the cost of abuse is one email to ourselves.
 */
const hits = new Map<string, number[]>()

const isRateLimited = (ip: string): boolean => {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((at) => now - at < RATE_WINDOW_MS)

  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent)
    return true
  }

  recent.push(now)
  hits.set(ip, recent)
  return false
}

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status })

export async function POST(request: Request) {
  if (!isContactConfigured()) {
    /*
      Said plainly rather than silently accepting. A form that reports success
      and drops the message is what actually loses a takedown request.
    */
    return errorResponse(
      "This form is not available right now. Please try again later.",
      503
    )
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()

  if (ip && isRateLimited(ip)) {
    return errorResponse(
      "Too many messages sent. Please try again in an hour.",
      429
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return errorResponse("Request body must be valid JSON.", 400)
  }

  const parsed = contactSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please correct the highlighted fields.",
        fields: firstFieldErrors(parsed.error),
      },
      { status: 400 }
    )
  }

  const token =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>).turnstileToken
      : undefined
  const verified = await verifyTurnstileToken(token, ip)

  if (!verified) {
    return errorResponse(
      "We could not verify your request. Please try again.",
      403
    )
  }

  const { kind, email, domain, message } = parsed.data

  const resend = new Resend(process.env.RESEND_API_KEY)

  const subject =
    kind === "privacy"
      ? `Privacy request${domain ? ` — ${domain}` : ""}`
      : `Rights-holder request${domain ? ` — ${domain}` : ""}`

  const { error } = await resend.emails.send({
    from: RESEND_FROM,
    to: CONTACT_EMAIL,
    replyTo: email,
    subject,
    text: [
      `Kind: ${kind || "unspecified"}`,
      `From: ${email}`,
      `Domain: ${domain || "not given"}`,
      "",
      message,
    ].join("\n"),
  })

  if (error) {
    // Logged, not returned: provider error text can leak the key or the
    // destination address.
    console.error("contact form send failed", error)
    return errorResponse(
      "Unable to send your message. Please try again in a few minutes.",
      502
    )
  }

  return NextResponse.json({ ok: true })
}
