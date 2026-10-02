"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type SendState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "sent" }
  | { status: "error"; message: string }

/**
 * Contact form for merchant and rights-holder requests. The one email that must
 * never be lost, so two decisions shape it: it hides entirely when no API key is
 * configured, rather than rendering a control that fails on submit, and it is
 * replaced by a confirmation on success, because a still-editable form after a
 * send invites a double submit.
 */
export const ContactForm = ({
  kind,
  configured,
}: {
  /** What the sender wants, so a request can be triaged without reading it. */
  kind: "general" | "privacy" | "rights"
  /** False when no API key is set. The form does not render at all. */
  configured: boolean
}) => {
  const [state, setState] = React.useState<SendState>({ status: "idle" })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const form = event.currentTarget
    const data = new FormData(form)

    setState({ status: "sending" })

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          email: data.get("email"),
          domain: data.get("domain"),
          message: data.get("message"),
        }),
      })

      if (response.ok) {
        setState({ status: "sent" })
        return
      }

      const body = (await response.json().catch(() => null)) as {
        error?: string
      } | null

      setState({
        status: "error",
        message: body?.error ?? "Unable to send. Please try again.",
      })
    } catch {
      setState({
        status: "error",
        message:
          "Unable to reach the server. Check your connection and try again.",
      })
    }
  }

  if (!configured) return null

  if (state.status === "sent") {
    return (
      <div
        className="rounded-lg border bg-muted/40 px-4 py-5"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm font-medium">Message sent</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We read every one of these. If you are removing a storefront, the
          change goes live on our next deploy.
        </p>
      </div>
    )
  }

  const sending = state.status === "sending"
  const error = state.status === "error" ? state.message : null

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-email">Your email</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@yourstore.com"
            aria-invalid={error ? true : undefined}
            disabled={sending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-domain">Your store domain</Label>
          <Input
            id="contact-domain"
            name="domain"
            type="text"
            placeholder="Optional"
            aria-invalid={error ? true : undefined}
            disabled={sending}
          />
        </div>
      </div>

      {/*
        Label and placeholder are generic because the form serves three
        unrelated requests: featuring a store, removal, and a general question.
        "What would you like us to change?" assumed every request was a
        complaint, which is wrong for the two that are not.

        The page's own headings already say which kind of request each is, and
        the domain field stays optional so a general question does not force a
        storefront into the message.
      */}
      <div className="space-y-2">
        <Label htmlFor="contact-message">Your message</Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          placeholder="Tell us what you need."
          aria-invalid={error ? true : undefined}
          disabled={sending}
        />
      </div>

      {/*
        `aria-live` on a region that is always in the DOM. Announcing a node
        that does not exist yet is unreliable, so the container is rendered
        unconditionally and only its contents change.
      */}
      <p role="alert" aria-live="assertive" className="min-h-5 text-sm">
        {error ? (
          <span className="text-destructive">{error}</span>
        ) : (
          <span className="sr-only">
            {sending ? "Sending your message." : ""}
          </span>
        )}
      </p>

      <Button type="submit" disabled={sending}>
        {sending ? "Sending" : "Send request"}
      </Button>
    </form>
  )
}
