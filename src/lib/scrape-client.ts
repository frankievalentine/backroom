import { normalizeDomain } from "@/lib/domain"
import type { ShopifyProduct } from "@/lib/shopify"
import type { WebsiteType } from "@/lib/website-detector"

export type ScrapeSuccess = {
  ok: true
  /** Canonical domain echoed back by the server. Always trust this over the input. */
  domain: string
  products: ShopifyProduct[]
  websiteType: WebsiteType
  truncated: boolean
}

export type ScrapeFailure = {
  ok: false
  /** Canonical domain when the input was valid enough to normalise. */
  domain: string | null
  error: string
}

export type ScrapeResult = ScrapeSuccess | ScrapeFailure

type ScrapeOptions = {
  signal?: AbortSignal
}

/**
 * POST a domain to the scrape endpoint.
 *
 * Normalisation happens on the server and the canonical `domain` comes back in
 * the response, so callers must store and display *that* value rather than
 * whatever the user typed.
 */
export const scrapeStore = async (
  input: string,
  { signal }: ScrapeOptions = {}
): Promise<ScrapeResult> => {
  // Fail fast on input we know is invalid, without spending a round trip.
  const normalized = normalizeDomain(input)

  if (!normalized.ok) {
    return { ok: false, domain: null, error: normalized.reason }
  }

  let response: Response

  try {
    response = await fetch("/api/scrape", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ domain: input }),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error
    }

    return {
      ok: false,
      domain: normalized.domain,
      error: "Could not reach the server. Check your connection and try again.",
    }
  }

  const data: unknown = await response.json().catch(() => null)

  const readError = (): string => {
    if (data && typeof data === "object" && "error" in data) {
      const { error } = data as { error: unknown }

      if (typeof error === "string" && error) return error
    }

    return `Request failed with status ${response.status}.`
  }

  if (!response.ok) {
    // 422 carries a canonical domain alongside the "not a Shopify store" message.
    const domain =
      data && typeof data === "object" && "domain" in data
        ? ((data as { domain: unknown }).domain as string | undefined)
        : normalized.domain

    return {
      ok: false,
      domain: domain ?? normalized.domain,
      error: readError(),
    }
  }

  if (!data || typeof data !== "object") {
    return {
      ok: false,
      domain: normalized.domain,
      error: "The server returned an unexpected response.",
    }
  }

  const payload = data as {
    domain?: unknown
    products?: unknown
    websiteType?: unknown
    truncated?: unknown
  }

  return {
    ok: true,
    domain:
      typeof payload.domain === "string" ? payload.domain : normalized.domain,
    products: Array.isArray(payload.products)
      ? (payload.products as ShopifyProduct[])
      : [],
    websiteType: payload.websiteType === "shopify" ? "shopify" : "unknown",
    truncated: payload.truncated === true,
  }
}
