import { SparklesIcon } from "lucide-react"
import Link from "next/link"

import type { FeaturedPlacement } from "@/lib/featured"

/**
 * Label honesty is enforced here rather than trusted to the data.
 *
 * A `sponsored` entry only claims "Sponsored" once it is `live`; until then it
 * reads as a sample, so nobody mistakes seeded filler for a real paid
 * placement. Editorial features always say "Featured".
 *
 * Renders a plain element, not a list item: this card is now placed inside a
 * carousel, whose items are `<div>`s, and an `<li>` nested there would produce
 * invalid markup with no owning list.
 */
export const FeaturedCard = ({
  placement,
}: {
  placement: FeaturedPlacement
}) => {
  const isSponsored = placement.kind === "sponsored"
  const isLive = placement.status === "live"

  return (
    <div className="group/feature relative flex h-full flex-col rounded-xl border bg-card p-6 transition-colors hover:border-foreground/25 focus-within:border-ring">
      <Link
        href={`/scraper?domain=${encodeURIComponent(placement.domain)}`}
        className="flex flex-1 flex-col rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <span className="flex items-center gap-2">
          {isSponsored ? (
            isLive ? (
              <span className="rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Sponsored
              </span>
            ) : (
              <span className="rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground/70">
                Sample placement
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              <SparklesIcon className="size-3" aria-hidden="true" />
              Featured
            </span>
          )}
        </span>

        <span className="mt-4 text-lg font-semibold tracking-tight">
          {placement.name}
        </span>

        <span className="mt-1 text-sm font-medium text-pretty">
          {placement.headline}
        </span>

        <span className="mt-2 max-w-prose text-sm text-pretty text-muted-foreground">
          {placement.description}
        </span>

        <span className="mt-auto flex items-center justify-between gap-2 pt-6 text-xs">
          <span className="truncate font-mono text-muted-foreground/80">
            {placement.domain}
          </span>
          <span className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/feature:opacity-100 group-focus-within/feature:opacity-100 motion-reduce:transition-none">
            Open
          </span>
        </span>

        <span className="sr-only">
          : open {placement.domain} in the scraper
        </span>
      </Link>
    </div>
  )
}
