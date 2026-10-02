"use client"

import * as React from "react"

import { FeaturedCard, type FeaturedCardData } from "@/components/FeaturedCard"
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { TOOL_ROUTE } from "@/lib/brand"
import type { FeaturedPlacement } from "@/lib/featured"

/**
 * The one badge this section uses.
 *
 * A constant so filler, pitch and a real placement cannot drift apart.
 */
const SPONSORED_BADGE = "Sponsored"

/**
 * Filler slides shown while there is nothing real to display.
 *
 * Every badge reads "Sponsored", because every slot is paid; alternating badges
 * implied two tiers of customer that do not exist. Deliberately generic too --
 * real brand names as samples read as placements whatever the badge said, and
 * borrowing an endorsement nobody gave is worse than looking empty.
 */
const FILLER: readonly FeaturedCardData[] = [
  {
    id: "filler-1",
    badge: SPONSORED_BADGE,
    title: "Store name",
    body: "One line on what makes this store worth browsing.",
    isFiller: true,
  },
  {
    id: "filler-2",
    badge: SPONSORED_BADGE,
    title: "Store name",
    body: "A card and a link straight to your catalog.",
    isFiller: true,
  },
  {
    id: "filler-3",
    badge: SPONSORED_BADGE,
    title: "Store name",
    body: "Your products, filtered by brand, type, tag and price.",
    isFiller: true,
  },
]

/** The invitation to buy a slot. Leads the row while slots are empty. */
const PITCH: FeaturedCardData = {
  id: "pitch",
  badge: SPONSORED_BADGE,
  title: "Your store here",
  body: "A card and a link above the fold, pointed straight at your catalog. It does not change how your store is filtered or ranked anywhere else.",
  cta: { href: "/contact", label: "Sponsor a slot" },
}

/**
 * A placement as carousel data. The badge is unconditional: every slot is paid,
 * so branching here would admit an unmarked store into a section whose whole
 * claim is that everything in it is disclosed.
 */
const toCardData = (placement: FeaturedPlacement): FeaturedCardData => ({
  id: placement.id,
  badge: SPONSORED_BADGE,
  title: placement.name,
  body: placement.headline,
  href: `${TOOL_ROUTE}?domain=${encodeURIComponent(placement.domain)}`,
  meta: placement.domain,
})

/** Slides per view at each breakpoint, kept in one place so they cannot drift. */
const BASIS = {
  base: "basis-[86%]",
  sm: "sm:basis-1/2",
  lg: "lg:basis-1/3",
} as const

/**
 * Sponsored placements, as a carousel.
 *
 * Embla drives real scroll-snap, so touch, trackpad and keyboard work with no
 * custom handlers. Three things are layered on the stock component:
 *
 * 1. `containScroll: "trimSnaps"`, which stops the last slide being dragged past
 *    its resting point and leaving a gap beside it at wide widths.
 * 2. A live position readout. Prev/next disabling says nothing once both are
 *    enabled; "2 of 4" is unambiguous.
 * 3. Controls inside the scroller box. The default `-left-12`/`-right-12` sits
 *    outside the max-width container, so on a narrow viewport they overflow.
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

  // Embla measures snap points on mount. Before that the readout would announce
  // "0 of 0", so it stays hidden until there is a real number.
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

  /*
    Pitch first, then real placements, then filler to pad the row.

    Filler count is derived, not fixed: one card per genuinely empty slot, so a
    single paying store does not sit beside three placeholders implying three more
    are available. The pitch drops away once every slot is sold.
  */
  const emptySlots = Math.max(FILLER.length - placements.length, 0)
  const slides: FeaturedCardData[] = [
    ...(emptySlots > 0 ? [PITCH] : []),
    ...placements.map(toCardData),
    ...FILLER.slice(0, emptySlots),
  ]

  return (
    <Carousel
      setApi={setApi}
      /*
        `slidesToScroll: 1` advances one slide per press rather than a whole
        page, so "2 of 2" is reachable in a single click.

        No autoplay: an interval-driven rotation on a home page is motion nobody
        asked for, and it fights anyone trying to read or click a card.
      */
      opts={{
        align: "start",
        containScroll: "trimSnaps",
        slidesToScroll: 1,
      }}
      aria-label={label}
    >
      <CarouselContent className="-ml-4">
        {slides.map((slide) => (
          <CarouselItem
            key={slide.id}
            className={`pl-4 ${BASIS.base} ${BASIS.sm} ${BASIS.lg}`}
          >
            <FeaturedCard slide={slide} />
          </CarouselItem>
        ))}
      </CarouselContent>

      {/*
        Must stay inside <Carousel>: the controls read its context for the scroll
        handlers and can-scroll state. `static` overrides the stock absolute
        positioning, which put them outside the section's container.
      */}
      <div className="mt-5 flex items-center justify-end gap-3">
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
