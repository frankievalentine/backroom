"use client"

import Script from "next/script"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ContactInput } from "@/lib/contact"
import { contactSchema, firstFieldErrors } from "@/lib/contact"

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string
          action: string
          theme: "auto"
          callback: (token: string) => void
          "error-callback": () => void
          "expired-callback": () => void
        }
      ) => string
      reset: (widgetId: string) => void
      remove?: (widgetId: string) => void
    }
  }
}

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
  const [fieldErrors, setFieldErrors] = React.useState<
    Partial<Record<keyof ContactInput, string>>
  >({})
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(
    null
  )
  const [widgetIssue, setWidgetIssue] = React.useState(false)
  const [scriptReady, setScriptReady] = React.useState(false)
  const [containerReady, setContainerReady] = React.useState(false)
  const widgetContainer = React.useRef<HTMLDivElement>(null)
  const widgetId = React.useRef<string | null>(null)
  const setWidgetContainer = React.useCallback(
    (node: HTMLDivElement | null) => {
      widgetContainer.current = node
      setContainerReady(Boolean(node))
    },
    []
  )

  React.useEffect(() => {
    if (
      !scriptReady ||
      !containerReady ||
      !widgetContainer.current ||
      widgetId.current
    ) {
      return
    }

    const turnstile = window.turnstile
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    if (!turnstile || !sitekey) {
      setWidgetIssue(true)
      return
    }

    try {
      widgetId.current = turnstile.render(widgetContainer.current, {
        sitekey,
        action: "contact",
        theme: "auto",
        callback: (token) => {
          setTurnstileToken(token)
          setWidgetIssue(false)
        },
        "error-callback": () => {
          setTurnstileToken(null)
          setWidgetIssue(true)
        },
        "expired-callback": () => setTurnstileToken(null),
      })
    } catch {
      setWidgetIssue(true)
    }
  }, [containerReady, scriptReady])

  React.useEffect(
    () => () => {
      const id = widgetId.current
      widgetId.current = null

      const turnstile = window.turnstile
      if (id && turnstile?.remove) {
        try {
          turnstile.remove(id)
        } catch {
          // The component is already leaving; there is no widget left to recover.
        }
      }
    },
    []
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget

    try {
      const data = new FormData(form)
      const input = {
        kind,
        email: data.get("email"),
        domain: data.get("domain"),
        message: data.get("message"),
      }
      const parsed = contactSchema.safeParse(input)

      if (!parsed.success) {
        setFieldErrors(firstFieldErrors(parsed.error))
        setState({ status: "idle" })
        return
      }

      setFieldErrors({})
      setState({ status: "sending" })

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...parsed.data, turnstileToken }),
      })

      if (response.ok) {
        setState({ status: "sent" })
        return
      }

      const body = (await response.json().catch(() => null)) as {
        error?: string
        fields?: Partial<Record<keyof ContactInput, string>>
      } | null

      setFieldErrors(body?.fields ?? {})
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
    } finally {
      setTurnstileToken(null)
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetId.current)
        } catch {
          setWidgetIssue(true)
        }
      }
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
  const emailError = fieldErrors.email
  const domainError = fieldErrors.domain
  const messageError = fieldErrors.message

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
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "contact-email-error" : undefined}
            disabled={sending}
          />
          {emailError && (
            <p id="contact-email-error" className="text-sm text-destructive">
              <span className="font-medium">Error:</span> {emailError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-domain">Your store domain</Label>
          <Input
            id="contact-domain"
            name="domain"
            type="text"
            placeholder="Optional"
            aria-invalid={domainError ? true : undefined}
            aria-describedby={domainError ? "contact-domain-error" : undefined}
            disabled={sending}
          />
          {domainError && (
            <p id="contact-domain-error" className="text-sm text-destructive">
              <span className="font-medium">Error:</span> {domainError}
            </p>
          )}
        </div>
      </div>

      {/* Keep the message, live region, verification, and action as one tighter group. */}
      <div className="space-y-3">
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
            aria-invalid={messageError ? true : undefined}
            aria-describedby={
              messageError ? "contact-message-error" : undefined
            }
            disabled={sending}
          />
          {messageError && (
            <p id="contact-message-error" className="text-sm text-destructive">
              <span className="font-medium">Error:</span> {messageError}
            </p>
          )}
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

        <div>
          {/*
          Explicit rendering provides the ID needed for reset and removal. `onReady`
          runs again on remount after client navigation; the effect waits until the
          container ref is committed before rendering.
        */}
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onReady={() => setScriptReady(true)}
            onError={() => setWidgetIssue(true)}
          />
          <div ref={setWidgetContainer} />
          {widgetIssue && (
            <p className="mt-2 text-sm text-muted-foreground">
              Verification is unavailable right now. Please refresh and try
              again.
            </p>
          )}
        </div>

        <Button type="submit" disabled={sending || !turnstileToken}>
          {sending ? "Sending" : "Send request"}
        </Button>
      </div>
    </form>
  )
}
