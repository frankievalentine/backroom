import { ArrowRightIcon } from "lucide-react"
import Link from "next/link"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCatalogueSize, type PopularSite } from "@/lib/popular-sites"
import { cn } from "@/lib/utils"

type SiteCardProps = {
  site: PopularSite
  /** Rendered as a wider feature card rather than a compact grid cell. */
  featured?: boolean
}

/**
 * A single ranked store. Links into the scraper with the domain preselected, so
 * clicking a card on the home page lands on loaded results instead of an empty
 * form the user has to fill in again.
 */
export const SiteCard = ({ site, featured = false }: SiteCardProps) => (
  <Card
    className={cn(
      "group/card relative gap-0 py-0 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
      featured && "sm:grid sm:grid-cols-[1fr_auto] sm:items-end"
    )}
  >
    <CardHeader className="gap-1.5">
      <CardTitle className="text-sm font-medium">
        <Link
          href={`/scraper?domain=${encodeURIComponent(site.domain)}`}
          className="after:absolute after:inset-0 after:content-[''] rounded-sm hover:underline focus-visible:outline-none"
        >
          {site.name}
          <span className="sr-only">
            : browse {site.category.toLowerCase()} from {site.domain} in the
            scraper
          </span>
        </Link>
      </CardTitle>

      <CardDescription className="text-xs">
        {site.category}
        <span aria-hidden="true"> · </span>
        <span className="text-muted-foreground/70">{site.domain}</span>
      </CardDescription>

      {!featured && (
        <p className="text-xs tabular-nums text-muted-foreground">
          {formatCatalogueSize(site)}
        </p>
      )}
    </CardHeader>

    {featured && (
      <span
        aria-hidden="true"
        className="hidden size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-transform motion-reduce:transition-none group-hover/card:translate-x-0.5 motion-reduce:group-hover/card:translate-x-0 sm:grid"
      >
        <ArrowRightIcon className="size-4" />
      </span>
    )}
  </Card>
)
