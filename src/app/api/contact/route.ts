import { NextResponse } from "next/server"
import { Resend } from "resend"

import { CONTACT_EMAIL, isContactConfigured, RESEND_FROM } from "@/lib/legal"

/**
 * Merchant and rights-holder requests.
 *
 * An earlier version pointed at a `mailto:` address on a domain that does not
 * resolve, which is the worst of both: a link that silently goes nowhere while
 * implying a monitored inbox. A form that either delivers or says it cannot is
 * honest in a way a dead address is not.
 *
 * Two things make this safe to expose publicly. It is rate limited per IP so it
 * cannot be used to send mail to anyone else, and the visitor's address is used
 * as `replyTo` rather than as a sender, so a visitor cannot spoof the From
 * header and make the message look like it came from us.
 */

/** Requests allowed per IP per hour. Comfortably above real takedown volume. */
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000

/**
 * Best-effort per-isolate rate limit.
 *
 * The same caveat as the scrape cache: this resets when the isolate recycles, so
 * it is a speed bump against casual misuse rather than a hard guarantee. It is
 * enough here because the cost of abuse is a single email to ourselves, not a
 * bill for someone else.
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

type RequestBody = {
  kind?: unknown
  email?: unknown
  domain?: unknown
  message?: unknown
}

const asText = (value: unknown, limit: number): string =>
  typeof value === "string" ? value.trim().slice(0, limit) : ""

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status })

export async function POST(request: Request) {
  if (!isContactConfigured()) {
    /*
      Said plainly rather than silently accepting. A form that reports success
      and drops the message is the failure mode that actually loses a takedown
      request, and this is the one email that must never be lost.
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

  let body: RequestBody

  try {
    body = (await request.json()) as RequestBody
  } catch {
    return errorResponse("Request body must be valid JSON.", 400)
  }

  const kind = asText(body.kind, 60)
  const email = asText(body.email, 200)
  const domain = asText(body.domain, 200)
  const message = asText(body.message, 4000)

  // Said next to the field that failed, per the writing rules, and the same
  // text the form shows inline so the two cannot disagree.
  if (!message) {
    return errorResponse("Tell us what you would like us to change.", 400)
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return errorResponse("Enter an email address so we can reply.", 400)
  }

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
    // Logged rather than returned. The visitor gets a generic message because
    // provider error text can leak the API key or the destination address.
    console.error("contact form send failed", error)
    return errorResponse(
      "Unable to send your message. Please try again in a few minutes.",
      502
    )
  }

  return NextResponse.json({ ok: true })
}
