import { ArrowRightIcon, SparklesIcon } from "lucide-react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { TOOL_ROUTE } from "@/lib/brand"
import { cn } from "@/lib/utils"

/**
 * One slide, in the shape the carousel needs it.
 *
 * Placements, pitch and filler are one component with different data, not three
 * that drift apart. Filler is set apart by the data saying so: no `href`, muted
 * text, `isFiller`.
 */
export type FeaturedCardData = {
  id: string
  /** The label chip. Real sponsored slots must read "Sponsored". */
  badge: string
  title: string
  body: string
  /** Where the card links. Absent on filler, which is not clickable. */
  href?: string
  /** Small trailing label, used for the domain on a real card. */
  meta?: string
  cta?: { href: string; label: string }
  /** Filler is inert: not clickable, and visually recessive. */
  isFiller?: boolean
}

type FeaturedCardProps = {
  slide: FeaturedCardData
}

/**
 * A carousel slide. Three cases, distinguished by data: a real placement, the
 * pitch card, or filler.
 *
 * Filler says "Store name" rather than borrowing a real brand: an earlier version
 * put four named companies under a "Featured stores" heading, and a "Sample
 * placement" badge does not undo that, because the impression is formed from the
 * names before the badge is read.
 *
 * Filler is not focusable and has no hover treatment, so a keyboard user cannot
 * land on something that does nothing.
 */
export const FeaturedCard = ({ slide }: FeaturedCardProps) => {
  const reducedMotion = usePrefersReducedMotion()
  const isFiller = slide.isFiller ?? false

  const body = (
    <>
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
          isFiller
            ? "border border-dashed text-muted-foreground/70"
            : "bg-secondary text-secondary-foreground"
        )}
      >
        {!isFiller && <SparklesIcon className="size-3" aria-hidden="true" />}
        {slide.badge}
      </span>

      <span className="mt-4 text-lg font-semibold tracking-tight">
        {slide.title}
      </span>

      <span
        className={cn(
          "mt-2 max-w-prose text-sm text-pretty",
          isFiller && "text-muted-foreground/70"
        )}
      >
        {slide.body}
      </span>
    </>
  )

  const glow = (
    <GlowingEffect
      disabled={reducedMotion || isFiller}
      glow
      spread={42}
      proximity={64}
      inactiveZone={0}
      movementDuration={1.4}
      borderWidth={1.5}
    />
  )

  const shell = cn(
    "group/feature relative flex h-full flex-col rounded-xl border p-6 transition-colors focus-within:border-ring",
    isFiller
      ? "border-dashed bg-transparent"
      : "bg-card hover:border-foreground/25"
  )

  // Filler: no link, no affordance, nothing to focus.
  if (isFiller) {
    return (
      <div className={shell} aria-hidden="true">
        {body}
      </div>
    )
  }

  /*
    `flex flex-col` is load-bearing. The body is a fragment of spans separated by
    margins, and margin-top does nothing on an inline box; inside a flex
    container those spans become flex items, which blockifies them and makes the
    spacing apply. Without it the badge, title and copy collapse onto one line.
  */
  const pitchShell = "relative flex flex-1 flex-col"

  // Pitch card: a button rather than a card-wide link, because the action is
  // "start a conversation", not "browse this store".
  if (slide.cta) {
    return (
      <div className={cn(shell, "bg-card")}>
        {glow}

        <div className={pitchShell}>{body}</div>

        <div className="relative pt-6">
          <Link
            href={slide.cta.href}
            className={buttonVariants({ size: "sm" })}
            aria-label={`${slide.cta.label} on Backroom`}
          >
            {slide.cta.label}
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </div>
      </div>
    )
  }

  // Real placement: the whole card is the link.
  return (
    <div className={cn(shell, "bg-card")}>
      {glow}

      <Link
        href={slide.href ?? TOOL_ROUTE}
        className="relative flex flex-1 flex-col rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        {body}

        {slide.meta && (
          <span className="mt-auto flex items-center justify-between gap-2 pt-6 text-xs">
            <span className="truncate font-mono text-muted-foreground/80">
              {slide.meta}
            </span>
            <span className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/feature:opacity-100 group-focus-within/feature:opacity-100 motion-reduce:transition-none">
              Open
            </span>
          </span>
        )}

        {/*
          Names the destination for a screen reader; without it the link is
          announced as just the store's name, which does not convey that it
          leaves the home page for a catalog view.
        */}
        <span className="sr-only">: open {slide.meta} in the catalog</span>
      </Link>
    </div>
  )
}
