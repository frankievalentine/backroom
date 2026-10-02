import { ContactForm } from "@/components/ContactForm"
import { SiteHeader } from "@/components/SiteHeader"
import { isContactConfigured } from "@/lib/legal"

/**
 * Shared shell for the legal pages.
 *
 * Carries the site header so these pages are navigable rather than dead ends,
 * and puts a rule above the footer so the footer reads as chrome belonging to
 * the site instead of the last paragraph of the document.
 *
 * The reading measure is capped well below the site width. Legal text in a
 * full-width column is genuinely hard to read, since lines that long make the eye
 * lose its place on the return sweep, and these are the pages most likely to be
 * read start to finish.
 *
 * `isContactConfigured` is read here, on the server, so the form is never sent to
 * a browser that cannot use it. That check cannot live in the client component:
 * `RESEND_API_KEY` must not be bundled into client JavaScript, and a form that
 * renders and then fails is worse than one that never appears.
 */
export const LegalPage = ({
  title,
  updated,
  intro,
  formKind,
  children,
}: {
  title: string
  updated: string
  intro: string
  /** Which page this is, so a submitted request can be triaged. */
  formKind: "privacy" | "rights"
  children: React.ReactNode
}) => {
  const contactConfigured = isContactConfigured()

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader hideToolLink />

      <main
        id="main-content"
        className="mx-auto w-full max-w-2xl flex-1 px-5 py-16 sm:px-8"
      >
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Effective {updated}
        </p>
        <p className="mt-6 text-pretty text-muted-foreground">{intro}</p>

        <div className="mt-10 space-y-10">{children}</div>

        {/*
          A contact form rather than a mailto. A mailto on a domain that does not
          resolve fails silently while looking like it worked, and this is the
          one message that must never be lost. Rendered only when a key is
          configured, so a visitor is never shown a form that cannot deliver.
        */}
        {contactConfigured && (
          // `id` because the footer links straight here with /terms#contact, and
          // `scroll-mt` so the sticky header does not cover the heading.
          <section id="contact" className="mt-16 scroll-mt-20 border-t pt-10">
            <h2 className="text-xl font-semibold tracking-tight">Contact us</h2>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
              Merchant removal and rights-holder requests both come here. We
              read every one and do not ask you to justify the request.
            </p>
            <div className="mt-6">
              <ContactForm kind={formKind} configured={contactConfigured} />
            </div>
          </section>
        )}
      </main>

      {/* Rule above the footer so it separates from the document body. */}
      <footer className="border-t">
        <div className="mx-auto w-full max-w-2xl px-5 py-8 text-sm text-muted-foreground sm:px-8">
          Backroom — an independent storefront explorer. Not affiliated with
          Shopify.
        </div>
      </footer>
    </div>
  )
}
