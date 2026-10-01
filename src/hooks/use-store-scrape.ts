"use client"

import * as React from "react"

import { scrapeStore } from "@/lib/scrape-client"
import type { ShopifyProduct } from "@/lib/shopify"

export type ScrapeStatus = "idle" | "loading" | "success" | "error"

type ScrapeState = {
  /** Canonical domain currently loaded, or null when nothing is selected. */
  domain: string | null
  products: ShopifyProduct[]
  status: ScrapeStatus
  error: string | null
  /** True when pagination stopped early, so the count on screen is a floor. */
  truncated: boolean
}

/**
 * Owns the scrape lifecycle for one store at a time.
 *
 * Every load aborts the previous request. Without that, switching stores quickly
 * let a slow earlier response land after a fast later one and overwrite the
 * results for the store the user is actually looking at.
 */
export const useStoreScrape = () => {
  const [state, setState] = React.useState<ScrapeState>({
    domain: null,
    products: [],
    status: "idle",
    error: null,
    truncated: false,
  })

  const abortRef = React.useRef<AbortController | null>(null)
  const mountedRef = React.useRef(true)

  React.useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  const load = React.useCallback(
    async (input: string): Promise<string | null> => {
      abortRef.current?.abort()

      const controller = new AbortController()

      abortRef.current = controller

      setState((current) => ({
        ...current,
        status: "loading",
        error: null,
      }))

      try {
        const result = await scrapeStore(input, { signal: controller.signal })

        if (!mountedRef.current || controller.signal.aborted) return null

        if (!result.ok) {
          setState({
            domain: result.domain,
            products: [],
            status: "error",
            error: result.error,
            truncated: false,
          })

          return result.domain
        }

        setState({
          domain: result.domain,
          products: result.products,
          status: "success",
          error: null,
          truncated: result.truncated,
        })

        return result.domain
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return null

        if (!mountedRef.current) return null

        setState((current) => ({
          ...current,
          status: "error",
          error:
            "Could not reach the server. Check your connection and try again.",
        }))

        return null
      }
    },
    []
  )

  const reset = React.useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null

    setState({
      domain: null,
      products: [],
      status: "idle",
      error: null,
      truncated: false,
    })
  }, [])

  return { ...state, load, reset }
}
