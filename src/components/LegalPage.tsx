import { SiteHeader } from "@/components/SiteHeader"
import { isContactConfigured } from "@/lib/legal"

/**
 * Shared shell for the legal pages.
 *
 * Carries the site header so these pages are navigable, and caps the measure well
 * below the site width: legal text in a full-width column is hard to read, and
 * these are the pages most likely to be read start to finish.
 *
 * Deliberately does not render the contact form. It lives on /contact, so there
 * is one place a request can be sent from; two forms means one eventually stops
 * working, and this is the request that must not be lost.
 */
export const LegalPage = ({
  title,
  updated,
  intro,
  children,
}: {
  title: string
  updated?: string
  intro: string
  children: React.ReactNode
}) => (
  <div className="flex min-h-svh flex-col">
    <SiteHeader hideToolLink />

    <main
      id="main-content"
      className="mx-auto w-full max-w-2xl flex-1 px-5 py-16 sm:px-8"
    >
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>

      {updated && (
        <p className="mt-2 text-sm text-muted-foreground">
          Effective {updated}
        </p>
      )}

      <p className="mt-6 text-pretty text-muted-foreground">{intro}</p>

      <div className="mt-10 space-y-10">{children}</div>
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

/** Re-exported so /contact imports the shell and the lib, not both from lib. */
export { isContactConfigured }
