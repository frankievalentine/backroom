import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SiteHeaderProps = {
  /** Route context shown next to the wordmark, e.g. the loaded domain. */
  parent?: string
  /** Right-hand slot. Defaults to a link into the scraper. */
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
  children,
  className,
}: SiteHeaderProps) => (
  <header
    className={cn(
      "sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm",
      className
    )}
  >
    <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight">
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-md">
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
        {children ?? (
          <Link
            href="/scraper"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Open scraper
          </Link>
        )}
      </div>
    </div>
  </header>
)
