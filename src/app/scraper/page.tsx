import type { Metadata } from "next"
import { Suspense } from "react"
import { ScraperClient } from "@/app/scraper/scraper-client"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Scraper",
  description:
    "Paste a Shopify storefront URL and browse its full product catalogue.",
}

const ResultsFallback = () => (
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

export default function ScraperPage() {
  return (
    // `useSearchParams` needs a Suspense boundary, otherwise the route opts out
    // of static rendering entirely.
    <Suspense fallback={<ResultsFallback />}>
      <ScraperClient />
    </Suspense>
  )
}
