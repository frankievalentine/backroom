import Link from "next/link"

/**
 * Shared shell for the legal pages.
 *
 * The reading measure is capped well below the page width. Legal text in a
 * full-width column is genuinely hard to read -- lines that long cause the eye
 * to lose its place on the return sweep -- and these pages are the ones most
 * likely to be read start to finish.
 */
export const LegalPage = ({
  title,
  updated,
  intro,
  children,
}: {
  title: string
  updated: string
  intro: string
  children: React.ReactNode
}) => (
  <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-5 py-16 sm:px-8">
    <main id="main-content" className="flex-1">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Effective {updated}</p>
      <p className="mt-6 text-pretty text-muted-foreground">{intro}</p>

      <div className="mt-10 space-y-10">{children}</div>
    </main>

    <footer className="mt-16 border-t pt-6 text-sm text-muted-foreground">
      <Link
        href="/"
        className="underline underline-offset-4 hover:text-foreground"
      >
        Back to Backroom
      </Link>
    </footer>
  </div>
)
