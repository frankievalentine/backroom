import { ArrowRightIcon, BoxesIcon, FilterIcon, ZapIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { FeaturedCard } from "@/components/FeaturedCard"
import { SiteCard } from "@/components/SiteCard"
import { SiteHeader } from "@/components/SiteHeader"
import { buttonVariants } from "@/components/ui/button"
import { getHeroPlacement, getSupportingPlacements } from "@/lib/featured"
import { getPopularSites } from "@/lib/popular-sites"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Product Scraper",
  description:
    "Paste a Shopify storefront URL and browse its full product catalogue. Filter by vendor, type, tag and price.",
}

const VALUE_PROPS = [
  {
    icon: ZapIcon,
    title: "No setup",
    body: "Paste a storefront URL and the catalogue loads. No account, no key, no install.",
  },
  {
    icon: BoxesIcon,
    title: "Every product, every variant",
    body: "Shopify paginates its catalogue. We walk the pages so large stores are not silently truncated.",
  },
  {
    icon: FilterIcon,
    title: "Real facets",
    body: "Filter on the metadata the store already publishes: vendor, product type, tags and price.",
  },
]

const SectionHeading = ({
  title,
  description,
}: {
  title: string
  description: string
}) => (
  <div className="mb-6 space-y-1">
    <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
    <p className="max-w-prose text-sm text-pretty text-muted-foreground">
      {description}
    </p>
  </div>
)

export default function HomePage() {
  const popularSites = getPopularSites()
  const hero = getHeroPlacement()
  const supporting = getSupportingPlacements()

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/*
          Hero. Every section below sits in the same max-width container so the
          left edge never jumps between sections.
        */}
        <section className="border-b">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Browse any Shopify store&rsquo;s full catalogue
              </h1>

              <p className="mt-4 text-base text-pretty text-muted-foreground sm:text-lg">
                Paste a storefront URL and get every product with its variants,
                pricing, imagery and metadata. Filter it down the way you would
                in the store&rsquo;s own search.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/scraper"
                  className={cn(buttonVariants({ size: "lg" }), "gap-1.5")}
                >
                  Open the scraper
                  <ArrowRightIcon aria-hidden="true" />
                </Link>

                {popularSites[0] && (
                  <Link
                    href={`/scraper?domain=${encodeURIComponent(
                      popularSites[0].domain
                    )}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" })
                    )}
                  >
                    Try {popularSites[0].name ?? popularSites[0].domain}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
          <ul className="grid gap-6 sm:grid-cols-3">
            {VALUE_PROPS.map((item) => (
              <li key={item.title} className="space-y-2">
                <span
                  aria-hidden="true"
                  className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground"
                >
                  <item.icon className="size-4" />
                </span>
                <h3 className="text-sm font-medium">{item.title}</h3>
                <p className="text-sm text-pretty text-muted-foreground">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/*
          Featured and sponsored. The label distinction is not decoration: a
          paid slot has to read as paid.
        */}
        {(hero || supporting.length > 0) && (
          <section
            aria-labelledby="featured-heading"
            className="border-y bg-muted/40"
          >
            <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
              <SectionHeading
                title="Featured stores"
                description="Stores worth pointing a new user at. Sponsored placements are labelled as such."
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {hero && <FeaturedCard placement={hero} hero />}

                {supporting.map((placement) => (
                  <FeaturedCard key={placement.id} placement={placement} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section
          aria-labelledby="popular-heading"
          className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6"
        >
          <SectionHeading
            title="Popular Shopify stores"
            description="A ranked shortlist of well-known storefronts, handy if you want to see how a large catalogue is structured before pointing the scraper at your own."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popularSites.map((site) => (
              <SiteCard key={site.domain} site={site} />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Product Scraper. Not affiliated with Shopify. Store data belongs to
            its owners.
          </p>
          <Link
            href="/scraper"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Open the scraper
          </Link>
        </div>
      </footer>
    </div>
  )
}
