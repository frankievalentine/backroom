import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SiteHeaderProps = {
  /** Route context shown next to the wordmark, e.g. the loaded domain. */
  parent?: string
  /**
   * Set on the scraper route.
   *
   * The "Open scraper" call to action is suppressed here, because it would link
   * the scraper page to itself. This has to be an explicit signal rather than
   * inferred from `parent`: with no store loaded there is no parent either, and
   * inferring from that left the self-link showing on exactly the page it should
   * never appear on.
   */
  hideScraperLink?: boolean
  /** Right-hand slot. Overrides the default call to action entirely. */
  children?: React.ReactNode
  className?: string
}

/**
 * Sticky app header.
 *
 * Intentionally renders no heading. Each route owns its own `h1` -- on the home
 * page that is the hero headline, not the wordmark -- so the header uses a plain
 * link to avoid two competing top-level headings per document.
 */
export const SiteHeader = ({
  parent,
  hideScraperLink = false,
  children,
  className,
}: SiteHeaderProps) => {
  const showDefaultAction = children === undefined && !hideScraperLink

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm",
        className
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-md"
          >
            <span
              aria-hidden="true"
              className="grid size-6 place-items-center rounded-md bg-primary text-[0.625rem] font-bold text-primary-foreground"
            >
              PS
            </span>
            <span className="hidden sm:inline">Product Scraper</span>
            <span className="sm:hidden">PS</span>
            <span className="sr-only">, home</span>
          </Link>

          {parent && (
            <>
              <span aria-hidden="true" className="text-muted-foreground/50">
                /
              </span>
              <span className="min-w-0 truncate font-normal text-muted-foreground">
                {parent}
              </span>
            </>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {children ??
            (showDefaultAction ? (
              <Link
                href="/scraper"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" })
                )}
              >
                Open scraper
              </Link>
            ) : null)}
        </div>
      </div>
    </header>
  )
}
