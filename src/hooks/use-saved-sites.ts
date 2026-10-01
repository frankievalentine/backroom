"use client"

import * as React from "react"

const STORAGE_KEY = "backroom:saved-sites"

export type SavedSite = {
  domain: string
  addedAt: string
}

const isSavedSite = (value: unknown): value is SavedSite => {
  if (!value || typeof value !== "object") return false

  const site = value as Record<string, unknown>

  return typeof site.domain === "string" && typeof site.addedAt === "string"
}

/**
 * Persisted list of saved stores.
 *
 * Normalisation happens in two places on purpose. `addSite` normalises before
 * storing, and `readStoredSites` normalises again on load, so a list written by
 * an older build (or hand-edited) cannot reintroduce duplicates.
 *
 * Hydration is deferred to an effect. Reading localStorage during render would
 * produce different markup on the server and the client, which React reports as
 * a hydration mismatch.
 */
export const useSavedSites = () => {
  const [sites, setSites] = React.useState<SavedSite[]>([])
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)

      if (stored) {
        const parsed: unknown = JSON.parse(stored)

        if (Array.isArray(parsed)) {
          const seen = new Set<string>()
          const deduped = parsed
            .filter(isSavedSite)
            .map((site) => ({
              domain: site.domain.toLowerCase(),
              addedAt: site.addedAt,
            }))
            .filter((site) => {
              if (seen.has(site.domain)) return false

              seen.add(site.domain)
              return true
            })

          setSites(deduped)
        }
      }
    } catch {
      // A corrupt or unavailable store should not break the app; start empty.
    } finally {
      setHydrated(true)
    }
  }, [])

  const persist = React.useCallback((next: SavedSite[]) => {
    setSites(next)

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Private browsing or a full quota. The in-memory list still works.
    }
  }, [])

  const addSite = React.useCallback(
    (domain: string, addedAt = new Date().toISOString()) => {
      let added = false

      setSites((current) => {
        if (current.some((site) => site.domain === domain)) return current

        added = true

        const next = [...current, { domain, addedAt }]

        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {
          // See above: keep the in-memory update, skip persistence.
        }

        return next
      })

      return added
    },
    []
  )

  const removeSite = React.useCallback((domain: string) => {
    setSites((current) => {
      const next = current.filter((site) => site.domain !== domain)

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // See above.
      }

      return next
    })
  }, [])

  const clearSites = React.useCallback(() => {
    persist([])
  }, [persist])

  return { sites, hydrated, addSite, removeSite, clearSites }
}
