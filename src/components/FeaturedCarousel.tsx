"use client"

import * as React from "react"

import { FeaturedCard } from "@/components/FeaturedCard"
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import type { FeaturedPlacement } from "@/lib/featured"

/** Slides per view at each breakpoint. Kept in one place so they cannot drift. */
const BASIS = {
  base: "basis-[86%]",
  sm: "sm:basis-1/2",
  lg: "lg:basis-1/3",
} as const

/**
 * Featured and sponsored placements, as a carousel.
 *
 * Embla drives real scroll-snap, so touch, trackpad and keyboard all work with
 * no custom handlers. Three things are layered on top of the stock component:
 *
 * 1. `containScroll: "trimSnaps"` stops the last slide being dragged past its
 *    resting point, which otherwise leaves a gap beside it at wide widths.
 *
 * 2. A live position readout. Prev/next disabling is a subtle cue, and once both
 *    are enabled it says nothing at all. "2 of 4" is unambiguous.
 *
 * 3. Controls placed inside the scroller box rather than at the default
 *    `-left-12`/`-right-12`. Those sit outside the section's max-width
 *    container, so on a narrow viewport they overflow the page or get clipped.
 */
export const FeaturedCarousel = ({
  placements,
  label,
}: {
  placements: FeaturedPlacement[]
  /** Names the carousel region for assistive technology. */
  label: string
}) => {
  const [api, setApi] = React.useState<CarouselApi>()
  const [snapCount, setSnapCount] = React.useState(0)
  const [current, setCurrent] = React.useState(0)

  // Embla measures snap points on mount. Before it has, the readout would
  // announce "0 of 0", so it stays hidden until there is a real number.
  const hasSnapCount = snapCount > 0

  React.useEffect(() => {
    if (!api) return

    const sync = () => {
      setSnapCount(api.scrollSnapList().length)
      // Embla reports 0-based; the readout is 1-based.
      setCurrent(api.selectedScrollSnap() + 1)
    }

    sync()
    api.on("select", sync)
    api.on("reInit", sync)

    return () => {
      api.off("select", sync)
      api.off("reInit", sync)
    }
  }, [api])

  return (
    <Carousel
      setApi={setApi}
      /*
        `slidesToScroll: 1` advances one slide per press rather than a whole
        page, so "2 of 2" is reachable with a single click. The default of a
        full page jump would skip past single remaining slides.

        No autoplay: an interval-driven rotation on a home page is motion nobody
        asked for, and it would fight anyone trying to read or click a card.
      */
      opts={{
        align: "start",
        containScroll: "trimSnaps",
        slidesToScroll: 1,
      }}
      aria-label={label}
    >
      <CarouselContent className="-ml-4">
        {placements.map((placement) => (
          <CarouselItem
            key={placement.id}
            className={`pl-4 ${BASIS.base} ${BASIS.sm} ${BASIS.lg}`}
          >
            <FeaturedCard placement={placement} />
          </CarouselItem>
        ))}
      </CarouselContent>

      {/*
        These must stay inside <Carousel>: they read its context for the
        scroll handlers and the can-scroll state.

        `static` overrides the stock absolute positioning, which placed them at
        -left-12/-right-12 -- outside this section's max-width container, where
        they overflow the viewport or get clipped on narrow screens. A normal
        flow row below the scroller works at every width.
      */}
      <div className="mt-5 flex items-center justify-end gap-3">
        {/*
          Rendered only once Embla has reported a snap count. Announcing "0 of 0"
          before that is worse than saying nothing at all.
        */}
        {hasSnapCount && (
          <p
            aria-live="polite"
            className="text-xs tabular-nums text-muted-foreground"
          >
            {current} of {snapCount}
          </p>
        )}

        <CarouselPrevious className="static translate-y-0" />
        <CarouselNext className="static translate-y-0" />
      </div>
    </Carousel>
  )
}
