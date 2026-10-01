"use client"

import * as React from "react"

const QUERY = "(prefers-reduced-motion: reduce)"

/**
 * Whether the user has asked for reduced motion.
 *
 * Starts `false` and corrects in an effect, because `matchMedia` cannot be read
 * during render without breaking hydration: the server has no way to know the
 * preference, so reading it there would produce markup the client cannot match.
 *
 * `false` on the first paint is the safe default here. Every consumer uses this
 * to switch motion *off*, so the worst case is that the effect animates for one
 * frame before being torn down, rather than being wrongly suppressed.
 */
export const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  React.useEffect(() => {
    const query = window.matchMedia(QUERY)

    setPrefersReducedMotion(query.matches)

    const handleChange = (event: MediaQueryListEvent) =>
      setPrefersReducedMotion(event.matches)

    query.addEventListener("change", handleChange)

    return () => query.removeEventListener("change", handleChange)
  }, [])

  return prefersReducedMotion
}
