import type { Metadata } from "next"

import { CatalogViewer } from "@/app/backroom/backroom-client"
import { readDomain, readStore, type StoreReadResult } from "@/lib/store-read"

export const metadata: Metadata = {
  title: "Browse stores",
  description:
    "Paste a Shopify storefront URL and browse its full product catalog.",
  // robots.txt deliberately allows this route so crawlers can read this noindex directive.
  robots: { index: false, follow: true },
}

/**
 * The `?domain=` param is read here rather than with `useSearchParams` in the
 * client, which keeps the route a server component so the shell, its `<main>`
 * and its heading ship in the initial HTML.
 *
 * The read is passed down as a promise and never awaited here, which is what lets
 * the page stream: this returns immediately, and only the product grid waits,
 * behind a Suspense boundary inside CatalogViewer. Awaiting it here would put the
 * whole route behind one boundary, so the sidebar, toolbar, `<main>` and `<h1>`
 * would be skeletons for the full walk -- measured at ten seconds on a
 * 5,000-product store, with no landmark and no heading on screen.
 */
export default async function BackroomPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const requestedDomain = params.domain
  const rawDomain = Array.isArray(requestedDomain)
    ? requestedDomain[0]
    : requestedDomain

  /*
    Only start a read when the input is normalisable. Without this the component
    would suspend on a promise that can only ever resolve to an error, which
    means flashing a skeleton before showing a message the server already knew
    at render time.
  */
  const normalized = rawDomain ? readDomain(rawDomain) : null
  const domain = normalized?.ok ? normalized.domain : null
  const reason = normalized && !normalized.ok ? normalized.reason : null

  const store: Promise<StoreReadResult> | null = domain
    ? readStore(domain)
    : null

  return (
    <CatalogViewer initialDomain={domain} initialError={reason} store={store} />
  )
}
