import Link from "next/link"

import { BrandMark } from "@/components/BrandMark"
import { buttonVariants } from "@/components/ui/button"
import { BRAND_NAME } from "@/lib/brand"
import { cn } from "@/lib/utils"

type SiteHeaderProps = {
  /** Route context shown next to the wordmark, e.g. the loaded domain. */
  parent?: string
  /**
   * Set on the catalog route.
   *
   * The call to action into the tool is suppressed there, because it would link
   * the page to itself. This has to be an explicit signal rather than inferred
   * from `parent`: with no store loaded there is no parent either, and inferring
   * from that left the self-link showing on exactly the page it should never
   * appear on.
   */
  hideToolLink?: boolean
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
  hideToolLink = false,
  children,
  className,
}: SiteHeaderProps) => {
  const showDefaultAction = children === undefined && !hideToolLink

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm",
        className
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight">
          {/* `group` is what the door's hover animation hangs off, in globals.css. */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2 rounded-md"
          >
            <BrandMark />
            <span className="hidden sm:inline">{BRAND_NAME}</span>
            <span className="sm:hidden">{BRAND_NAME}</span>
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
                href="/backroom"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" })
                )}
              >
                Open explorer
              </Link>
            ) : null)}
        </div>
      </div>
    </header>
  )
}
