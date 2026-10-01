import type { Metadata } from "next"
import { Suspense } from "react"
import { ScraperClient } from "@/app/scraper/scraper-client"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Scraper",
  description:
    "Paste a Shopify storefront URL and browse its full product catalogue.",
}

const WorkspaceFallback = () => (
  <div
    role="status"
    aria-busy="true"
    aria-live="polite"
    aria-label="Loading the scraper"
    className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6"
  >
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  </div>
)

/**
 * The `?domain=` param is read here rather than with `useSearchParams` in the
 * client.
 *
 * That keeps the route a server component, so the shell, its `<main>` landmark
 * and its heading all ship in the initial HTML. Reading the param from the
 * client instead would push the entire page behind a Suspense boundary, and a
 * reader arriving without JavaScript would get nothing but skeletons.
 */
export default async function ScraperPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const requestedDomain = params.domain
  const initialDomain = Array.isArray(requestedDomain)
    ? requestedDomain[0]
    : requestedDomain

  return (
    <Suspense fallback={<WorkspaceFallback />}>
      <ScraperClient initialDomain={initialDomain} />
    </Suspense>
  )
}
