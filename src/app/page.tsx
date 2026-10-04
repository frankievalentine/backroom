import { ArrowRightIcon, BoxesIcon, FilterIcon, ZapIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { FeaturedCarousel } from "@/components/FeaturedCarousel"
import { SiteCard } from "@/components/SiteCard"
import { SiteHeader } from "@/components/SiteHeader"
import { SkipLink } from "@/components/SkipLink"
import { TryAStore } from "@/components/TryAStore"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { buttonVariants } from "@/components/ui/button"
import { BRAND_NAME, REPOSITORY_URL, TOOL_ROUTE } from "@/lib/brand"
import { FAQ_ENTRIES } from "@/lib/faq"
import { getHeroPlacement, getSupportingPlacements } from "@/lib/featured"
import { AFFILIATION_DISCLAIMER } from "@/lib/legal"
import { getPopularSites } from "@/lib/popular-sites"
import { ROTATION_STORES } from "@/lib/rotation-stores"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: BRAND_NAME,
  description:
    "Paste a Shopify storefront URL and browse its full product catalog. Filter by vendor, type, tag and price.",
}

const PAGE_WIDTH = "max-w-6xl"

const VALUE_PROPS = [
  {
    icon: ZapIcon,
    title: "No setup",
    body: "Paste a storefront URL and the catalog loads. No account, no key, no install.",
  },
  {
    icon: BoxesIcon,
    title: "Every product, every variant",
    body: "Shopify paginates its catalog. We walk the pages rather than stopping at the first one.",
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

  /*
    Real placements for the carousel, hero first so the most important slot is the
    one visible without interacting.

    Empty until a store actually pays. The section still renders when it is,
    because the carousel fills itself with generic placeholder cards and a pitch,
    which is a better empty state than an absent section.
  */
  const featured = [getHeroPlacement(), ...getSupportingPlacements()].filter(
    (placement): placement is NonNullable<typeof placement> =>
      placement !== null
  )

  /*
    A live placement, held permanently by the rotating call to action below.
    Without this a paying store would be rotated past after four seconds, which is
    what makes a slot unbuyable.
  */
  const featuredStore = featured.find(
    (placement) => placement.status === "live"
  )

  /*
    Stores the rotating call to action cycles through, from their own list rather
    than the popular grid a few hundred pixels below.

    Reusing the popular list made the rotation look broken: a visitor clicking
    through the grid met the same stores again in the button above. A separate
    set also widens what is reachable from the first screen. See
    lib/rotation-stores.ts for how the domains were verified.

    Plain data crosses the client boundary. A sponsored placement is passed
    separately and pinned, so a paying store is never rotated past.
  */
  const rotatingStores = ROTATION_STORES

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
              Browse a Shopify store&rsquo;s catalog
            </h1>

            <p className="mt-5 max-w-lg text-lg text-pretty text-muted-foreground">
              Paste a storefront URL and get every product with its variants,
              pricing, imagery and metadata. Filter it down the way you would in
              the store&rsquo;s own search, then click any product to open it on
              the store itself.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={TOOL_ROUTE}
                className={cn(buttonVariants({ size: "lg" }), "gap-1.5")}
              >
                Open the explorer
                <ArrowRightIcon aria-hidden="true" />
              </Link>

              {rotatingStores.length > 0 && (
                <TryAStore
                  stores={rotatingStores}
                  pinnedDomain={featuredStore?.domain}
                />
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

        {/*
          Renders whenever there is room to sell, which is now always: the
          carousel pads itself with generic placeholder cards and a pitch, so the
          section is a better empty state than a missing section.

          The heading and its prose are no longer wrapped in a two-column row.
          That existed to sit a "Feature your store" button beside the heading,
          and the button now lives on the pitch card instead, where it is next to
          the thing it is selling.
        */}
        <section
          aria-labelledby="featured-heading"
          className={cn(
            "mx-auto w-full border-t px-5 py-16 sm:px-8 sm:py-20",
            PAGE_WIDTH
          )}
        >
          {/*
            Heading and description say the same thing on purpose.

            The previous pair promised editorial judgement in one word and
            admitted to money in the next: "Featured stores" above "Paid slots are
            labelled Sponsored". A reader is left working out which stores are
            editorial picks and which are ads, and why the two share a row.

            Every slot here is a paid placement and every one says Sponsored, so
            "featured" describes the section rather than vouching for a store. The
            catalogue lives further down the page and stays separate from anything
            money touches.
          */}
          <SectionHeading
            id="featured-heading"
            title="Sponsored stores"
            description="Paid placements on Backroom. Every store here is labelled Sponsored, and every one links straight to its catalog."
          />

          <div className="mt-8">
            <FeaturedCarousel
              placements={featured}
              label="Featured and sponsored stores"
            />
          </div>
        </section>

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
            description="A shortlist of well-known storefronts and how big their catalogs are. Open one to load it."
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

      {/*
        `border-t` separates the footer from the FAQ above it. Every other
        section on this page carries its own top rule, so the footer was the only
        break in the page without one and read as a continuation of the FAQ
        rather than as site chrome. Matches the rule on the legal pages.
      */}
      <footer
        className={cn("mx-auto w-full border-t px-5 py-10 sm:px-8", PAGE_WIDTH)}
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <p className="max-w-prose text-pretty">{AFFILIATION_DISCLAIMER}</p>

          {/*
            A flat list rather than a row that wraps oddly on mobile. Each label
            says where it goes, since a screen-reader user reaches these as a
            list of links and "Legal" alone would not distinguish them.

            The source link is an external anchor, not a `Link`, so it opens in a
            new tab and is marked as such for assistive technology. GitHub does
            not serve an SPA route, so client-side navigation would 404.
          */}
          <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Contact
            </Link>
            <a
              href={REPOSITORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              GitHub
              <span className="sr-only">
                {" "}
                (source code, opens in a new tab)
              </span>
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
