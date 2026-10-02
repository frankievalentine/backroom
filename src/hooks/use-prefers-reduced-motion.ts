"use client"

import * as React from "react"

const QUERY = "(prefers-reduced-motion: reduce)"

/**
 * Whether the user has asked for reduced motion.
 *
 * Starts `false` and corrects in an effect: `matchMedia` cannot be read during
 * render without breaking hydration, since the server cannot know the preference.
 *
 * `false` first is safe because every consumer uses this to switch motion *off*:
 * the worst case is one animated frame, rather than wrongly-suppressed motion.
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
