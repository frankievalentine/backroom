import type { Metadata } from "next"

import { ContactForm } from "@/components/ContactForm"
import { LegalPage } from "@/components/LegalPage"
import { isContactConfigured } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Sponsor a slot, request removal, or ask a question about Backroom.",
}

/**
 * Contact page.
 *
 * The single destination for every kind of request, so there is one form rather
 * than one per legal page. Requests are triaged by the `kind` field on the
 * route, and a visitor does not have to guess which page carries the form they
 * want.
 *
 * The form is server-gated on a key being configured. That check cannot live in
 * the client component: `RESEND_API_KEY` must never reach the browser, and a form
 * that renders and then fails is worse than one that never appears.
 */
export default function ContactPage() {
  const configured = isContactConfigured()

  return (
    <LegalPage
      title="Contact"
      intro="Three kinds of request come through here. Tell us which one you have and we will get back to you."
    >
      <section>
        <h2>Sponsor a slot</h2>
        <p>
          The home page has a sponsored section. Every placement in it is paid
          and every one carries a Sponsored label, so a reader is never left
          guessing which stores are advertising. Send us your domain and we will
          send you details.
        </p>
      </section>

      <section>
        <h2>Remove your store</h2>
        <p>
          If you run a Shopify storefront and would rather not be listed, ask
          and we will add your domain to a blocklist on the next deploy. You do
          not need to explain why, and we do not ask.
        </p>
      </section>

      <section>
        <h2>Anything else</h2>
        <p>
          Questions about how the tool works, a bug, or a correction to
          something we have got wrong, all go in the form below.
        </p>
      </section>

      {configured && (
        <section id="send" className="scroll-mt-20 border-t pt-10">
          <h2>Send a message</h2>
          <p className="mt-2 text-sm text-pretty text-muted-foreground">
            We read every one of these.
          </p>
          <div className="mt-6">
            <ContactForm kind="general" configured />
          </div>
        </section>
      )}
    </LegalPage>
  )
}
