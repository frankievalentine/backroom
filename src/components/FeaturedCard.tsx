import { SparklesIcon } from "lucide-react"
import Link from "next/link"

import { GlowingEffect } from "@/components/ui/glowing-effect"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { TOOL_ROUTE } from "@/lib/brand"
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
  const reducedMotion = usePrefersReducedMotion()

  return (
    <div className="group/feature relative flex h-full flex-col rounded-xl border bg-card p-6 transition-colors hover:border-foreground/25 focus-within:border-ring">
      {/*
        Pointer-tracked border glow.

        The card is `relative`, which is what this positions against, and the
        component is `pointer-events-none`, so it cannot intercept the card's
        click or its focus ring.

        Two things the component does not handle:

        1. `disabled` defaults to true and renders nothing, so it has to be
           turned off explicitly or this is dead markup.
        2. It attaches a document-level `pointermove` listener and animates a
           conic gradient every frame. Under `prefers-reduced-motion` that is
           precisely the continuous motion the preference asks us not to show,
           so the effect is skipped rather than merely slowed.

        The four-hue default is deliberate. An earlier version passed
        `variant="white"` on the grounds that the rainbow would fight the design
        system -- that reasoning was partly wrong, since these cards are on the
        home page and never share a viewport with the green `--price` token on
        the catalogue's product cards. The rainbow is confined to a 1.5px moving
        border on hover, so it reads as one surface treatment rather than as
        four competing brand colours.
      */}
      <GlowingEffect
        disabled={reducedMotion}
        glow
        spread={42}
        proximity={64}
        inactiveZone={0}
        movementDuration={1.4}
        borderWidth={1.5}
      />

      <Link
        href={`${TOOL_ROUTE}?domain=${encodeURIComponent(placement.domain)}`}
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
          : open {placement.domain} in the catalogue
        </span>
      </Link>
    </div>
  )
}
