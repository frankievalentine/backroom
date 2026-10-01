import { ArrowRightIcon } from "lucide-react"
import Link from "next/link"

import { TOOL_ROUTE } from "@/lib/brand"
import { formatCatalogSize, type PopularSite } from "@/lib/popular-sites"

/**
 * A ranked store tile.
 *
 * One layout for every instance, deliberately. An earlier version had a `featured`
 * variant that switched to a two-column grid and moved a badge into an absolute
 * corner, which meant no two tiles in a row shared an internal alignment. Cards
 * in a grid only read as a grid when their edges line up, so the structure here
 * is fixed and the differing content lengths are absorbed by `mt-auto` on the
 * footer row, which pins it to the bottom edge regardless of title length.
 */
export const SiteCard = ({ site }: { site: PopularSite }) => (
  <li className="group/tile relative flex h-full flex-col rounded-xl border bg-card p-4 transition-colors hover:border-foreground/25 focus-within:border-ring">
    <Link
      href={`${TOOL_ROUTE}?domain=${encodeURIComponent(site.domain)}`}
      className="flex flex-1 flex-col rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{site.name}</span>
        <ArrowRightIcon
          aria-hidden="true"
          className="size-3.5 shrink-0 translate-x-0.5 text-muted-foreground opacity-0 transition-[translate,opacity] group-hover/tile:translate-x-0 group-hover/tile:opacity-100 group-focus-within/tile:translate-x-0 group-focus-within/tile:opacity-100 motion-reduce:transition-none"
        />
      </span>

      <span className="mt-1 text-xs text-muted-foreground">
        {site.category}
      </span>

      {/* mt-auto pins this row to the bottom, so the counts line up across the
          row however long the names above them happen to be. */}
      <span className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs">
        <span className="truncate font-mono text-muted-foreground/80">
          {site.domain}
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {formatCatalogSize(site)}
        </span>
      </span>

      <span className="sr-only">
        , open {site.category.toLowerCase()} from {site.domain} in the catalog
      </span>
    </Link>
  </li>
)
