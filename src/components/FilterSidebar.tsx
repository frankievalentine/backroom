"use client"

import {
  Building2Icon,
  DollarSignIcon,
  PackageIcon,
  TagIcon,
  XIcon,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  buildFilterOptions,
  countActiveFilters,
  EMPTY_FILTERS,
  type FilterOption,
  type Filters,
  hasActiveFilters as filtersAreActive,
  PRICE_RANGES,
  type PriceRangeId,
  toggleValue,
} from "@/lib/filters"
import type { ShopifyProduct } from "@/lib/shopify"

type FilterSidebarProps = {
  products: ShopifyProduct[]
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

const FACET_ICONS = [
  { title: "Vendors", icon: Building2Icon },
  { title: "Product types", icon: PackageIcon },
  { title: "Price", icon: DollarSignIcon },
  { title: "Tags", icon: TagIcon },
] as const

/**
 * Rail navigation, shown only when the sidebar is collapsed to icons.
 *
 * A 3rem rail cannot show checkbox lists, so the full facets are hidden via
 * `group-data-[collapsible=icon]:hidden` and replaced by one icon per facet.
 * Each icon carries a tooltip naming its facet, and activates by expanding the
 * sidebar so the list itself is usable rather than hiding it behind a hover.
 */
const CollapsedFacetNav = () => {
  const { setOpen, isMobile } = useSidebar()

  const handleExpand = () => {
    // On mobile the sidebar is a Sheet with its own open state, and these
    // buttons only render in the desktop rail.
    if (isMobile) return

    setOpen(true)
  }

  return (
    <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
      {FACET_ICONS.map(({ title, icon: Icon }) => (
        <SidebarMenuItem key={title}>
          <SidebarMenuButton
            tooltip={title}
            onClick={handleExpand}
            className="justify-center"
          >
            <Icon aria-hidden="true" />
            <span>{title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

/** Rows rendered before the "Show all" control appears. */
const PREVIEW_COUNT = 8

/**
 * Turn a facet title into an id fragment.
 *
 * Titles are human strings ("Product types"), and an id may not contain
 * whitespace. Slugging once and reusing the result keeps the `<section>`,
 * its `<h3>` and every checkbox label pointing at the same valid id.
 */
const slugify = (value: string): string =>
  value.toLowerCase().replace(/\s+/g, "-")

type FacetSectionProps = {
  icon: React.ReactNode
  title: string
  options: FilterOption[]
  selected: string[]
  onToggle: (value: string) => void
  searchPlaceholder: string
  emptyMessage: string
}

/**
 * One collapsible facet.
 *
 * Lists longer than `PREVIEW_COUNT` collapse behind an explicit control. The
 * previous version hard-truncated tags at 20 with no way to reach the rest, and
 * rendered vendors uncapped, so a 500-vendor store produced 500 checkboxes.
 */
const FacetSection = ({
  icon,
  title,
  options,
  selected,
  onToggle,
  searchPlaceholder,
  emptyMessage,
}: FacetSectionProps) => {
  const [query, setQuery] = React.useState("")
  const [expanded, setExpanded] = React.useState(false)

  const headingId = `facet-${slugify(title)}`

  const term = query.trim().toLowerCase()

  const visible = React.useMemo(() => {
    if (!term) return options

    return options.filter((option) => option.value.toLowerCase().includes(term))
  }, [options, term])

  const isSearching = term.length > 0
  const canExpand = !isSearching && visible.length > PREVIEW_COUNT
  const shown =
    canExpand && !expanded ? visible.slice(0, PREVIEW_COUNT) : visible

  const selectedInSection = selected.filter((value) =>
    options.some((option) => option.value === value)
  ).length

  if (options.length === 0) return null

  return (
    <section aria-labelledby={headingId} className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground" aria-hidden="true">
          {icon}
        </span>
        <h3
          id={headingId}
          className="flex items-center gap-2 text-sm font-medium"
        >
          {title}
          {selectedInSection > 0 && (
            <Badge variant="secondary" className="tabular-nums">
              {selectedInSection}
            </Badge>
          )}
        </h3>
      </div>

      {options.length > PREVIEW_COUNT && (
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={`Filter ${title.toLowerCase()} options`}
          className="h-8"
        />
      )}

      {shown.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="space-y-0.5">
          {shown.map((option) => {
            const id = `${slugify(title)}-${option.value}`

            return (
              <li key={option.value}>
                <div className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-accent has-[[data-slot=checkbox]:focus-visible]:ring-2 has-[[data-slot=checkbox]:focus-visible]:ring-ring has-[[data-slot=checkbox]:focus-visible]:ring-inset">
                  <Checkbox
                    id={id}
                    checked={selected.includes(option.value)}
                    onCheckedChange={() => onToggle(option.value)}
                  />
                  <Label
                    htmlFor={id}
                    className="min-w-0 flex-1 cursor-pointer truncate font-normal"
                  >
                    {option.value}
                  </Label>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {option.count}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {canExpand && (
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => setExpanded((value) => !value)}
          className="h-auto px-1 py-0.5 text-xs"
        >
          {expanded ? "Show fewer" : `Show all ${visible.length}`}
        </Button>
      )}
    </section>
  )
}

/**
 * Wordmark for the scraper route.
 *
 * This route deliberately has no top navbar, so the product identity lives in
 * the sidebar. That also makes it the only route home on mobile, where the
 * sidebar is a Sheet with no other navigation in it.
 */
const SidebarWordmark = () => (
  <Link
    href="/"
    className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden"
  >
    <span
      aria-hidden="true"
      className="grid size-6 shrink-0 place-items-center rounded-md bg-primary text-[0.625rem] font-bold text-primary-foreground"
    >
      PS
    </span>
    <span className="truncate group-data-[collapsible=icon]:sr-only">
      Product Scraper
    </span>
  </Link>
)

type SidebarHeaderBlockProps = {
  active: boolean
  activeCount: number
  onClear: () => void
  /** Rendered only once a store is loaded, when there is something to clear. */
  showClear: boolean
}

/**
 * The sidebar's two header rows, shared by both states.
 *
 * The collapse trigger sits on the identity row, to the right of the wordmark,
 * because that is what it acts on: the whole panel. Sitting it beside the
 * "Filters" label made it read as a control over the filters alone.
 *
 * A separator divides the identity row from the filter controls, which are a
 * separate group with their own heading. Both rows bleed to the sidebar edges
 * and carry their own inline padding, so the divider spans the full width while
 * the text stays inside the margins.
 */
const SidebarHeaderBlock = ({
  active,
  activeCount,
  onClear,
  showClear,
}: SidebarHeaderBlockProps) => (
  <SidebarHeader className="gap-0 p-0">
    {/*
      A 3rem rail has about 16px of content width once the inline padding is
      taken, which is not enough for a wordmark badge and a 28px trigger side by
      side -- they overlapped. So when collapsed the wordmark gives way entirely
      and the trigger becomes the single, centred control that expands the rail.
    */}
    <div className="flex items-center gap-2 px-4 py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <SidebarWordmark />

      {/*
        Desktop only. Below `md` this sidebar is a Sheet that only mounts once
        open, so a trigger inside it could never be clicked and the filters
        would be unreachable. The toolbar renders the mobile equivalent, so
        exactly one of the two is present at any width.
      */}
      <SidebarTrigger
        className="hidden size-7 shrink-0 md:inline-flex"
        aria-label="Hide filters"
      />
    </div>

    <Separator />

    <div className="flex items-center justify-between gap-2 px-4 py-3">
      {/*
        Kept in the accessibility tree when collapsed via `sr-only` rather than
        hidden outright: the rail still belongs to a labelled region, and
        dropping the heading would leave the panel unnamed.
      */}
      <h2 className="text-sm font-medium group-data-[collapsible=icon]:sr-only">
        Filters
        {active && (
          <span className="ml-2 text-xs font-normal tabular-nums text-muted-foreground">
            {activeCount} active
          </span>
        )}
      </h2>

      {showClear && active && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 gap-1 px-2 text-xs group-data-[collapsible=icon]:hidden"
        >
          <XIcon aria-hidden="true" />
          Clear
        </Button>
      )}
    </div>
  </SidebarHeader>
)

export const FilterSidebar = ({
  products,
  filters,
  onFiltersChange,
}: FilterSidebarProps) => {
  const options = React.useMemo(() => buildFilterOptions(products), [products])
  const active = filtersAreActive(filters)
  const activeCount = countActiveFilters(filters)

  const handleToggle = React.useCallback(
    (facet: "vendors" | "productTypes" | "tags", value: string) => {
      onFiltersChange({
        ...filters,
        [facet]: toggleValue(filters[facet], value),
      })
    },
    [filters, onFiltersChange]
  )

  const handlePriceToggle = React.useCallback(
    (id: PriceRangeId) => {
      onFiltersChange({
        ...filters,
        priceRanges: toggleValue(filters.priceRanges, id) as PriceRangeId[],
      })
    },
    [filters, onFiltersChange]
  )

  const handleClear = React.useCallback(() => {
    onFiltersChange(EMPTY_FILTERS)
  }, [onFiltersChange])

  if (products.length === 0) {
    return (
      <Sidebar collapsible="icon" className="bg-sidebar" aria-label="Filters">
        <SidebarHeaderBlock
          active={active}
          activeCount={activeCount}
          onClear={handleClear}
          showClear={false}
        />

        <SidebarContent>
          <p className="px-4 text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
            Filters appear once a store is loaded.
          </p>
        </SidebarContent>
      </Sidebar>
    )
  }

  return (
    <Sidebar collapsible="icon" className="bg-sidebar" aria-label="Filters">
      <SidebarHeaderBlock
        active={active}
        activeCount={activeCount}
        onClear={handleClear}
        showClear
      />

      <SidebarContent>
        {/*
          Rail navigation replaces the full facet lists while collapsed. Both are
          rendered and toggled with `group-data-[collapsible=icon]`, which the
          docs recommend over a JS conditional: the sidebar's own state drives
          the visibility, so the two can never disagree.
        */}
        <CollapsedFacetNav />

        <ScrollArea className="flex-1 group-data-[collapsible=icon]:hidden">
          <div className="space-y-6 px-4 py-1 pb-8">
            <FacetSection
              icon={<Building2Icon className="size-4" />}
              title="Vendors"
              options={options.vendors}
              selected={filters.vendors}
              onToggle={(value) => handleToggle("vendors", value)}
              searchPlaceholder="Find a vendor"
              emptyMessage="No vendors match that search."
            />

            <FacetSection
              icon={<PackageIcon className="size-4" />}
              title="Product types"
              options={options.productTypes}
              selected={filters.productTypes}
              onToggle={(value) => handleToggle("productTypes", value)}
              searchPlaceholder="Find a type"
              emptyMessage="No product types match that search."
            />

            <section aria-labelledby="facet-price" className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSignIcon
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <h3 id="facet-price" className="text-sm font-medium">
                  Price
                </h3>
              </div>

              <ul className="space-y-0.5">
                {PRICE_RANGES.map((range) => {
                  const id = `price-${range.id}`

                  return (
                    <li key={range.id}>
                      <div className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-accent has-[[data-slot=checkbox]:focus-visible]:ring-2 has-[[data-slot=checkbox]:focus-visible]:ring-ring has-[[data-slot=checkbox]:focus-visible]:ring-inset">
                        <Checkbox
                          id={id}
                          checked={filters.priceRanges.includes(range.id)}
                          onCheckedChange={() => handlePriceToggle(range.id)}
                        />
                        <Label
                          htmlFor={id}
                          className="flex-1 cursor-pointer font-normal"
                        >
                          {range.label}
                        </Label>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>

            <FacetSection
              icon={<TagIcon className="size-4" />}
              title="Tags"
              options={options.tags}
              selected={filters.tags}
              onToggle={(value) => handleToggle("tags", value)}
              searchPlaceholder="Find a tag"
              emptyMessage="No tags match that search."
            />

            {active && (
              <>
                <Separator />
                <section aria-labelledby="active-filters" className="space-y-2">
                  <h3 id="active-filters" className="text-sm font-medium">
                    Applied
                  </h3>
                  <ul className="flex flex-wrap gap-1">
                    {filters.vendors.map((value) => (
                      <li key={`vendor-${value}`}>
                        <AppliedChip
                          label={value}
                          onRemove={() => handleToggle("vendors", value)}
                        />
                      </li>
                    ))}
                    {filters.productTypes.map((value) => (
                      <li key={`type-${value}`}>
                        <AppliedChip
                          label={value}
                          onRemove={() => handleToggle("productTypes", value)}
                        />
                      </li>
                    ))}
                    {filters.tags.map((value) => (
                      <li key={`tag-${value}`}>
                        <AppliedChip
                          label={value}
                          onRemove={() => handleToggle("tags", value)}
                        />
                      </li>
                    ))}
                    {filters.priceRanges.map((id) => {
                      const range = PRICE_RANGES.find(
                        (candidate) => candidate.id === id
                      )

                      if (!range) return null

                      return (
                        <li key={`price-${id}`}>
                          <AppliedChip
                            label={range.label}
                            onRemove={() => handlePriceToggle(id)}
                          />
                        </li>
                      )
                    })}
                  </ul>
                </section>
              </>
            )}
          </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  )
}

type AppliedChipProps = {
  label: string
  onRemove: () => void
}

/**
 * An applied filter that can be dismissed. The visible X is decorative; the
 * accessible name lives on the button so screen readers announce what will be
 * removed rather than just "button".
 */
const AppliedChip = ({ label, onRemove }: AppliedChipProps) => (
  <Badge variant="secondary" className="max-w-full gap-1 pr-1">
    <span className="truncate">{label}</span>
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${label} filter`}
      className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-destructive"
    >
      <XIcon aria-hidden="true" />
    </button>
  </Badge>
)
