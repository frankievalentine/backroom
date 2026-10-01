import { ArrowRightIcon, BoxesIcon, FilterIcon, ZapIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { FeaturedCarousel } from "@/components/FeaturedCarousel"
import { SiteCard } from "@/components/SiteCard"
import { SiteHeader } from "@/components/SiteHeader"
import { SkipLink } from "@/components/SkipLink"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { buttonVariants } from "@/components/ui/button"
import { FAQ_ENTRIES } from "@/lib/faq"
import { getHeroPlacement, getSupportingPlacements } from "@/lib/featured"
import { getPopularSites } from "@/lib/popular-sites"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Product Scraper",
  description:
    "Paste a Shopify storefront URL and browse its full product catalogue. Filter by vendor, type, tag and price.",
}

const PAGE_WIDTH = "max-w-6xl"

const VALUE_PROPS = [
  {
    icon: ZapIcon,
    title: "No setup",
    body: "Paste a storefront URL and the catalogue loads. No account, no key, no install.",
  },
  {
    icon: BoxesIcon,
    title: "Every product, every variant",
    body: "Shopify paginates its catalogue. We walk the pages rather than stopping at the first one.",
  },
  {
    icon: FilterIcon,
    title: "Real facets",
    body: "Filter on the metadata the store already publishes: vendor, type, tags and price.",
  },
]

/**
 * Section heading.
 *
 * `id` is applied to the `<h2>` because callers name their `<section>` with
 * `aria-labelledby`; a reference to a missing id leaves the section unnamed.
 */
const SectionHeading = ({
  id,
  title,
  description,
}: {
  id: string
  title: string
  description: string
}) => (
  <div className="max-w-prose">
    <h2 id={id} className="text-xl font-semibold tracking-tight text-balance">
      {title}
    </h2>
    <p className="mt-2 text-sm text-pretty text-muted-foreground">
      {description}
    </p>
  </div>
)

export default function HomePage() {
  const popularSites = getPopularSites()
  const leadSite = popularSites[0]

  // Hero placement leads the carousel, so the most important slot is the one
  // visible without interacting. Passes plain data across the client boundary.
  const featured = [getHeroPlacement(), ...getSupportingPlacements()].filter(
    (placement): placement is NonNullable<typeof placement> =>
      placement !== null
  )

  return (
    <div className="flex min-h-svh flex-col">
      <SkipLink />
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/*
          Hero. Content is capped well inside the page width rather than bleeding
          to the viewport edge, and the prose is capped again at a readable
          measure. Earlier full-bleed rules at 100vw read as bars cutting the page
          in half with nothing anchoring them.
        */}
        <section
          className={cn(
            "mx-auto w-full px-5 pt-20 pb-16 sm:px-8 sm:pt-28 sm:pb-20",
            PAGE_WIDTH
          )}
        >
          <div className="max-w-xl">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Browse any Shopify store&rsquo;s catalogue
            </h1>

            <p className="mt-5 text-lg text-pretty text-muted-foreground">
              Paste a storefront URL and get every product with its variants,
              pricing, imagery and metadata. Then filter it down the way you
              would in the store&rsquo;s own search.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/scraper"
                className={cn(buttonVariants({ size: "lg" }), "gap-1.5")}
              >
                Open the scraper
                <ArrowRightIcon aria-hidden="true" />
              </Link>

              {leadSite && (
                <Link
                  href={`/scraper?domain=${encodeURIComponent(leadSite.domain)}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" })
                  )}
                >
                  Try {leadSite.name}
                </Link>
              )}
            </div>
          </div>
        </section>

        {/*
          Value props. `<h2>` rather than `<h3>`: these sit directly under the
          page `<h1>` with no intervening `<h2>`, so heading them h3 would skip a
          level in the outline.
        */}
        <section
          aria-labelledby="why-heading"
          className={cn(
            "mx-auto w-full px-5 pb-16 sm:px-8 sm:pb-20",
            PAGE_WIDTH
          )}
        >
          <h2 id="why-heading" className="sr-only">
            Why use this
          </h2>

          <ul className="grid gap-8 sm:grid-cols-3 sm:gap-6">
            {VALUE_PROPS.map((item) => (
              <li key={item.title} className="space-y-2">
                <span
                  aria-hidden="true"
                  className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground"
                >
                  <item.icon className="size-4" />
                </span>
                <h3 className="text-sm font-medium">{item.title}</h3>
                <p className="max-w-prose text-sm text-pretty text-muted-foreground">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {featured.length > 0 && (
          <section
            aria-labelledby="featured-heading"
            className={cn(
              "mx-auto w-full border-t px-5 py-16 sm:px-8 sm:py-20",
              PAGE_WIDTH
            )}
          >
            <SectionHeading
              id="featured-heading"
              title="Featured stores"
              description="Stores worth pointing a new user at. A placement only reads as sponsored once a live deal is running."
            />

            <div className="mt-8">
              <FeaturedCarousel
                placements={featured}
                label="Featured and sponsored stores"
              />
            </div>
          </section>
        )}

        <section
          aria-labelledby="popular-heading"
          className={cn(
            "mx-auto w-full border-t px-5 py-16 sm:px-8 sm:py-20",
            PAGE_WIDTH
          )}
        >
          <SectionHeading
            id="popular-heading"
            title="Popular Shopify stores"
            description="A shortlist of well-known storefronts and how big their catalogues are. Open one to load it."
          />

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {popularSites.map((site) => (
              <SiteCard key={site.domain} site={site} />
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="faq-heading"
          className={cn(
            "mx-auto w-full border-t px-5 py-16 sm:px-8 sm:py-20",
            PAGE_WIDTH
          )}
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-12">
            <div className="max-w-prose">
              <h2
                id="faq-heading"
                className="text-xl font-semibold tracking-tight text-balance"
              >
                Frequently asked
              </h2>
              <p className="mt-2 text-sm text-pretty text-muted-foreground">
                What this tool does, what it deliberately does not do, and what
                happens to your data.
              </p>
            </div>

            <Accordion className="w-full">
              {FAQ_ENTRIES.map((entry) => (
                <AccordionItem key={entry.id} value={entry.id}>
                  <AccordionTrigger>{entry.question}</AccordionTrigger>
                  <AccordionContent>
                    <p className="max-w-prose text-pretty">{entry.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <footer className={cn("mx-auto w-full px-5 py-10 sm:px-8", PAGE_WIDTH)}>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
