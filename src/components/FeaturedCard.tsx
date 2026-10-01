import { SparklesIcon } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { FeaturedPlacement } from "@/lib/featured"
import { cn } from "@/lib/utils"

type FeaturedCardProps = {
  placement: FeaturedPlacement
  /** The lead slot gets more room. */
  hero?: boolean
}

export const FeaturedCard = ({
  placement,
  hero = false,
}: FeaturedCardProps) => {
  const isSponsored = placement.kind === "sponsored"

  return (
    <Card
      className={cn(
        "group relative gap-0 py-0 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        hero && "sm:col-span-2"
      )}
    >
      <CardHeader className="gap-2">
        {/*
          Label honesty is enforced here rather than trusted to the data.
          A `sponsored` entry only claims "Sponsored" once it is `live`; until
          then it reads as a sample, so nobody mistakes seeded filler for a real
          paid placement. Editorial features always say "Featured".
        */}
        {isSponsored ? (
          placement.status === "live" ? (
            <Badge
              variant="outline"
              className="w-fit border-border text-muted-foreground"
            >
              Sponsored
            </Badge>
          ) : (
            <Badge variant="outline" className="w-fit text-muted-foreground/70">
              Sample placement
            </Badge>
          )
        ) : (
          <Badge variant="secondary" className="w-fit gap-1">
            <SparklesIcon className="size-3" aria-hidden="true" />
            Featured
          </Badge>
        )}

        <CardTitle className={cn("font-medium", hero && "text-lg")}>
          <Link
            href={`/scraper?domain=${encodeURIComponent(placement.domain)}`}
            className="after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:outline-none"
          >
            {placement.name}
            <span className="sr-only">
              : open {placement.domain} in the scraper
            </span>
          </Link>
        </CardTitle>

        <p className="text-sm font-medium">{placement.headline}</p>

        <CardDescription className="text-pretty">
          {placement.description}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
