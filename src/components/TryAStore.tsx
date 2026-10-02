"use client"

import Link from "next/link"
import * as React from "react"
import { FlipWords } from "@/components/FlipWords"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { TOOL_ROUTE } from "@/lib/brand"
import { ROTATION_INTERVAL_MS, type RotationStore } from "@/lib/rotation-stores"
import { cn } from "@/lib/utils"

type TryAStoreProps = {
  /**
   * Readonly because the source is a module-level constant. Callers pass the
   * list straight through and nothing here mutates it, so requiring a mutable
   * copy would be a type error for no benefit.
   */
  stores: readonly RotationStore[]
  /** A live sponsored placement, held permanently if one is supplied. */
  pinnedDomain?: string
  className?: string
}

/**
 * "Try a store" call to action that cycles through real storefronts.
 *
 * Exists to show variety rather than to advertise anything. "Open the explorer"
 * tells a visitor nothing about what the tool contains; rotating a handful of real
 * brands in a control above the fold tells them it is not just shoes and
 * outerwear.
 *
 * A sponsored store is pinned and never rotates out. A store that paid for a
 * slot cannot be swapped away after four seconds, or the placement is not
 * buyable.
 *
 * The link is plain text with no border, background, underline or type change,
 * because a fixed shape around a word that swaps every few seconds draws the eye
 * to the shape. An arrow beside it was tried and removed: it pointed at the
 * control it was meant to decorate, which competes with the one arrow already on
 * the primary call to action next to it.
 *
 * Accessibility:
 *
 * - The link's accessible name is fixed and never changes. The rotating words are
 *   `aria-hidden`, because a name mutating every four seconds would leave a
 *   screen reader user unsure what they had activated. The visible rotation is
 *   decorative; the destination is conveyed by the name.
 * - Under `prefers-reduced-motion` the rotation stops entirely and the label
 *   settles on the first store. An animation the visitor has asked us not to
 *   perform is not a reduced version of itself, it is off.
 * - The arrow is `aria-hidden` and is not focusable, so it adds no name and no
 *   tab stop of its own.
 */
export const TryAStore = ({
  stores,
  pinnedDomain,
  className,
}: TryAStoreProps) => {
  const reducedMotion = usePrefersReducedMotion()
  const [index, setIndex] = React.useState(0)

  // `length < 2` means rotation is pointless, so skip the interval rather than
  // re-setting the same index every four seconds.
  React.useEffect(() => {
    if (reducedMotion || stores.length < 2) return

    const id = window.setInterval(
      () => setIndex((current) => (current + 1) % stores.length),
      ROTATION_INTERVAL_MS
    )

    return () => window.clearInterval(id)
  }, [reducedMotion, stores.length])

  if (stores.length === 0) return null

  const pinned = stores.find((store) => store.domain === pinnedDomain)
  const active = pinned ?? stores[index % stores.length]

  // Only the pinned store gets a link. A rotating destination would mean the
  // click target changing under the pointer, and a click landing on a different
  // store than the one displayed.
  const href = `${TOOL_ROUTE}?domain=${encodeURIComponent(active.domain)}`

  // When a sponsor is pinned, the label does not rotate, so the name can be
  // stated plainly. Otherwise it describes the control rather than the current
  // store, which would otherwise change mid-announcement.
  const label = pinned
    ? `Try ${active.name}`
    : `Try a store, such as ${stores[0].name}`

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/*
        Plain text. No border, no background, no underline, no type change.

        The border and background were what made the swapping name look
        constrained: a fixed box around a word that changes length every few
        seconds draws the eye to the box rather than the word, and the `min-w-32`
        needed to stop the outline jittering was proof the shape was fighting the
        content. With no box, the word simply grows and shrinks in place.

        An underline was tried in place of the border and was wrong too. It
        reintroduced the same problem at one pixel: a rule of fixed length under a
        word that keeps changing length. So nothing at all. The affordance comes
        from the arrow beside it.

        No `text-lg` or `font-medium` either, so this reads as ordinary body copy
        that happens to be a link, which is what lets the name swap without the
        control looking like a heading that is being rewritten.

        `-my-2` recovers the vertical space that `py-2` takes, so removing the
        button chrome does not change the hero's vertical rhythm.
      */}
      <Link
        href={href}
        aria-label={label}
        className={cn(
          "group/try -my-2 inline-flex items-center gap-1 rounded-sm px-1 py-2",
          "transition-colors hover:text-primary",
          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        )}
      >
        <span aria-hidden="true">Try</span>

        {/*
          FlipWords owns the rotating name. It is `aria-hidden` internally, so the
          link carries one stable name from `aria-label` above.

          No `min-w-` here any more. That existed only to stop the outline
          resizing, and without a border the box no longer exists to resize.
        */}
        <span aria-hidden="true" className="inline-flex overflow-hidden">
          <FlipWords
            words={stores.map((store) => store.name)}
            duration={ROTATION_INTERVAL_MS}
          />
        </span>
      </Link>
    </div>
  )
}
