"use client"

import { AnimatePresence, motion } from "motion/react"
import * as React from "react"

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { cn } from "@/lib/utils"

type FlipWordsProps = {
  words: string[]
  /** Milliseconds each word stays before the next flip. */
  duration?: number
  className?: string
}

/**
 * Rotates through a list of words, flipping up and out on each change.
 *
 * Built on the Aceternity Flip Words pattern, adapted for a call to action
 * rather than a hero headline. Three differences from the reference
 * implementation, each forced by using it inside a link:
 *
 * 1. **No stagger.** The original slides each word in on a 0.04s per-character
 *    stagger, which looks right for a 200ms hero line and terrible for a button
 *    label that swaps every few seconds. Here the word arrives as one unit.
 * 2. **The list is emptied, not re-keyed.** The original renders a single
 *    `motion.span` per index with `initial={false}` on later ones, which leaves
 *    every word mounted and hidden. Inside a button that leaves four labels in
 *    the accessibility tree, and a screen reader picks one at random. Only the
 *    active word is mounted here.
 * 3. **`aria-hidden` on the animation.** The rotation is decorative. A live
 *    region announcing a new store name every few seconds would make the control
 *    unusable, so the caller is responsible for the accessible name, which is
 *    stable and outside this component.
 *
 * `mode="wait"` so the outgoing word finishes leaving before the next arrives.
 * Without it both are briefly mounted and the button grows a character wider,
 * which nudges the layout on every flip.
 *
 * Respects `prefers-reduced-motion` by cross-fading instead of flipping, and
 * renders nothing at all when the motion preference is active, so the caller can
 * settle on one static label.
 */
export const FlipWords = ({
  words,
  duration = 4000,
  className,
}: FlipWordsProps) => {
  const reducedMotion = usePrefersReducedMotion()
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    if (reducedMotion || words.length < 2) return

    const id = window.setInterval(
      () => setIndex((current) => (current + 1) % words.length),
      duration
    )

    return () => window.clearInterval(id)
  }, [duration, reducedMotion, words.length])

  // Wrapped rather than calling the hook directly inside this component: it is
  // the hook's own useEffect that must not run when motion is unwanted, and an
  // early return before it would be a conditional hook call.
  if (words.length === 0) return null

  const word = words[index % words.length]

  return (
    <span className={cn("inline-flex", className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={word}
          initial={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 14, filter: "blur(4px)" }
          }
          animate={
            reducedMotion
              ? { opacity: 1 }
              : { opacity: 1, y: 0, filter: "blur(0px)" }
          }
          exit={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: -14, filter: "blur(4px)" }
          }
          transition={{
            duration: reducedMotion ? 0.15 : 0.35,
            ease: "easeOut",
          }}
          className="inline-block"
          aria-hidden="true"
        >
          {word}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
