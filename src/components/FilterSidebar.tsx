"use client"

import {
  Building2Icon,
  DollarSignIcon,
  type LucideIcon,
  PackageCheckIcon,
  PackageIcon,
  TagIcon,
  XIcon,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { BrandMark } from "@/components/BrandMark"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
} from "@/components/ui/sidebar"
import { BRAND_NAME } from "@/lib/brand"
import {
  AVAILABILITY_FILTER_LABEL,
  buildFilterOptions,
  countActiveFilters,
  describeRedundantFacet,
  EMPTY_FILTERS,
  type FacetRemovers,
  type FilterOption,
  type FilterOptions,
  type Filters,
  hasActiveFilters as filtersAreActive,
  findRedundantFacets,
  getAppliedChips,
  PRICE_RANGES,
  type PriceRangeId,
  type RedundantFacet,
  toggleValue,
} from "@/lib/filters"
import { isSoldOut, type ShopifyProduct } from "@/lib/shopify"

/** One checkbox row, shared by every facet so hit areas and focus stay uniform. */
const FacetRow = ({
  id,
  checked,
  onToggle,
  children,
  trailing,
}: {
  id: string
  checked: boolean
  onToggle: () => void
  children: React.ReactNode
  trailing?: React.ReactNode
}) => (
  <div className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-accent has-[[data-slot=checkbox]:focus-visible]:ring-2 has-[[data-slot=checkbox]:focus-visible]:ring-ring has-[[data-slot=checkbox]:focus-visible]:ring-inset">
    {/*
      `nativeButton` is required, not decorative. Base UI renders Checkbox as a
      `<span>` so an *enclosing* `<label>` can wrap it; this layout uses sibling
      `<label for>` pairs, and a `<span>` is not labelable, so the association
      silently did nothing.
    */}
    <Checkbox
      nativeButton
      render={<button type="button" />}
      id={id}
      checked={checked}
      onCheckedChange={onToggle}
    />
    <Label htmlFor={id} className="min-w-0 flex-1 cursor-pointer font-normal">
      {children}
    </Label>
    {trailing && (
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {trailing}
      </span>
    )}
  </div>
)

type PriceFacetProps = {
  selected: PriceRangeId[]
  onToggle: (id: PriceRangeId) => void
  hideHeading?: boolean
}

const PriceFacet = ({ selected, onToggle, hideHeading }: PriceFacetProps) => {
  const instanceId = React.useId()
  const headingId = `facet-price-${instanceId}`

  return (
    <section
      aria-labelledby={hideHeading ? undefined : headingId}
      aria-label={hideHeading ? "Price" : undefined}
      className="space-y-2"
    >
      {!hideHeading && (
        <div className="flex items-center gap-2">
          <DollarSignIcon
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <h3 id={headingId} className="text-sm font-medium">
            Price
          </h3>
        </div>
      )}

      <ul className="space-y-0.5">
        {PRICE_RANGES.map((range) => (
          <li key={range.id}>
            <FacetRow
              id={`price-${range.id}-${instanceId}`}
              checked={selected.includes(range.id)}
              onToggle={() => onToggle(range.id)}
            >
              {range.label}
            </FacetRow>
          </li>
        ))}
      </ul>
    </section>
  )
}

type AvailabilityFacetProps = {
  inStockOnly: boolean
  onToggle: (value: boolean) => void
  soldOutCount: number
  hideHeading?: boolean
}

/**
 * In-stock toggle.
 *
 * Off by default: sold-out items are real catalog entries. The count of what it
 * hides is shown so the control explains itself before it is used, rather than
 * appearing to do nothing on a fully in-stock store.
 */
const AvailabilityFacet = ({
  inStockOnly,
  onToggle,
  soldOutCount,
  hideHeading,
}: AvailabilityFacetProps) => {
  const instanceId = React.useId()
  const headingId = `facet-availability-${instanceId}`

  return (
    <section
      aria-labelledby={hideHeading ? undefined : headingId}
      aria-label={hideHeading ? "Availability" : undefined}
      className="space-y-2"
    >
      {!hideHeading && (
        <div className="flex items-center gap-2">
          <PackageCheckIcon
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <h3 id={headingId} className="text-sm font-medium">
            Availability
          </h3>
        </div>
      )}

      <ul className="space-y-0.5">
        <li>
          <FacetRow
            id={`in-stock-${instanceId}`}
            checked={inStockOnly}
            onToggle={() => onToggle(!inStockOnly)}
            trailing={soldOutCount > 0 ? soldOutCount : undefined}
          >
            {AVAILABILITY_FILTER_LABEL}
            {soldOutCount > 0 && (
              <span className="sr-only">
                {" "}
                ({soldOutCount} sold out in this catalog)
              </span>
            )}
          </FacetRow>
        </li>
      </ul>
    </section>
  )
}

type FilterSidebarProps = {
  products: ShopifyProduct[]
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

type RailFacet = "vendors" | "productTypes" | "price" | "tags"

const RAIL_FACETS: readonly {
  id: RailFacet
  title: string
  icon: LucideIcon
}[] = [
  { id: "vendors", title: "Vendors", icon: Building2Icon },
  { id: "productTypes", title: "Product types", icon: PackageIcon },
  { id: "price", title: "Price", icon: DollarSignIcon },
  { id: "tags", title: "Tags", icon: TagIcon },
]

type CollapsedFacetNavProps = {
  options: FilterOptions
  filters: Filters
  onToggle: (facet: "vendors" | "productTypes" | "tags", value: string) => void
  onPriceToggle: (id: PriceRangeId) => void
  onAvailabilityToggle: (value: boolean) => void
  soldOutCount: number
}

/**
 * Rail navigation, shown only when the sidebar is collapsed to icons.
 *
 * A 3rem rail cannot show checkbox lists, so each facet becomes an icon opening
 * its own popover. That keeps every filter reachable while collapsed, rather than
 * making the user expand the sidebar to change one checkbox.
 *
 * A popover rather than a dialog: these are short lists needing no title or
 * confirm action, and a non-modal surface leaves the rest of the rail reachable.
 */
const CollapsedFacetNav = ({
  options,
  filters,
  onToggle,
  onPriceToggle,
  onAvailabilityToggle,
  soldOutCount,
}: CollapsedFacetNavProps) => (
  <SidebarMenu className="hidden flex-col items-center group-data-[collapsible=icon]:flex">
    {RAIL_FACETS.map(({ id, title, icon: Icon }) => {
      const selectedCount =
        id === "price" ? filters.priceRanges.length : filters[id].length

      const body = (hideHeading: boolean) => {
        switch (id) {
          case "vendors":
            return (
              <FacetSection
                hideHeading={hideHeading}
                icon={<Icon className="size-4" />}
                title={title}
                options={options.vendors}
                selected={filters.vendors}
                onToggle={(value) => onToggle("vendors", value)}
                searchPlaceholder="Find a vendor"
                emptyMessage="No vendors match that search."
              />
            )
          case "productTypes":
            return (
              <FacetSection
                hideHeading={hideHeading}
                icon={<Icon className="size-4" />}
                title={title}
                options={options.productTypes}
                selected={filters.productTypes}
                onToggle={(value) => onToggle("productTypes", value)}
                searchPlaceholder="Find a type"
                emptyMessage="No product types match that search."
              />
            )
          case "price":
            return (
              <PriceFacet
                hideHeading={hideHeading}
                selected={filters.priceRanges}
                onToggle={onPriceToggle}
              />
            )
          case "tags":
            return (
              <FacetSection
                hideHeading={hideHeading}
                icon={<Icon className="size-4" />}
                title={title}
                options={options.tags}
                selected={filters.tags}
                onToggle={(value) => onToggle("tags", value)}
                searchPlaceholder="Find a tag"
                emptyMessage="No tags match that search."
              />
            )
        }
      }

      return (
        <SidebarMenuItem key={id} className="w-full">
          <Popover>
            <PopoverTrigger
              render={
                <SidebarMenuButton
                  tooltip={title}
                  // Centres the icon in the 3rem rail: a fixed 32px square inside
                  // a full-width item sat hard against the left edge.
                  className="mx-auto"
                />
              }
            >
              <Icon aria-hidden="true" />
              <span>{title}</span>
              {selectedCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-auto size-4 justify-center p-0 text-[0.625rem] tabular-nums"
                >
                  {selectedCount}
                </Badge>
              )}
            </PopoverTrigger>

            <PopoverContent
              align="start"
              side="bottom"
              className="w-72"
              aria-label={`${title} filters`}
            >
              <div className="p-1">
                {body(false)}

                <Separator className="my-3" />

                <AvailabilityFacet
                  hideHeading
                  inStockOnly={filters.inStockOnly}
                  onToggle={onAvailabilityToggle}
                  soldOutCount={soldOutCount}
                />
              </div>
            </PopoverContent>
          </Popover>
        </SidebarMenuItem>
      )
    })}
  </SidebarMenu>
)

/** Rows rendered before the "Show all" control appears. */
const PREVIEW_COUNT = 8

/**
 * Turn a facet title into an id fragment. Titles are human strings ("Product
 * types") and an id may not contain whitespace; slugging once keeps the
 * `<section>`, its `<h3>` and every checkbox label pointing at the same id.
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
  /** Hides the heading when the surrounding surface already provides one. */
  hideHeading?: boolean
  /**
   * Why this facet cannot narrow results, shown instead of the checkbox list.
   *
   * Without it a store publishing one vendor, or no tags at all, silently drops
   * a heading and leaves the user wondering whether the filter exists.
   */
  redundantNote?: string
}

/**
 * One collapsible facet. Lists longer than `PREVIEW_COUNT` collapse behind an
 * explicit control; an earlier version hard-truncated tags at 20 with no way to
 * reach the rest, and rendered vendors uncapped, so a 500-vendor store produced
 * 500 checkboxes.
 */
const FacetSection = ({
  icon,
  title,
  options,
  selected,
  onToggle,
  searchPlaceholder,
  emptyMessage,
  hideHeading = false,
  redundantNote,
}: FacetSectionProps) => {
  const [query, setQuery] = React.useState("")
  const [expanded, setExpanded] = React.useState(false)

  // `useId` because this facet renders twice: in the sidebar and again in the
  // collapsed rail's popover. A fixed id would be duplicated in the document and
  // `aria-labelledby` would resolve to the wrong one.
  const instanceId = React.useId()
  const headingId = `facet-${slugify(title)}-${instanceId}`

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
    <section
      aria-labelledby={hideHeading ? undefined : headingId}
      aria-label={hideHeading ? title : undefined}
      className="space-y-2"
      data-redundant={redundantNote ? "true" : undefined}
    >
      {!hideHeading && (
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
      )}

      {/*
        A redundant facet keeps its heading and says why it is inert, rather than
        returning null. Dropping it silently makes the filter look unavailable
        instead of inapplicable, which is the more confusing reading.
      */}
      {redundantNote ? (
        <p className="text-xs text-muted-foreground">{redundantNote}</p>
      ) : (
        <>
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
                        // See FacetRow: `nativeButton` is what makes the sibling
                        // `<label for>` association work at all.
                        nativeButton
                        render={<button type="button" />}
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
        </>
      )}
    </section>
  )
}

/**
 * Wordmark for the scraper route. That route has no top navbar, so the product
 * identity lives in the sidebar, which makes it the only route home on mobile
 * where the sidebar is a Sheet.
 */
const SidebarWordmark = () => (
  /* `group` is what the door's hover animation hangs off, in globals.css.
     A sidebar group also wraps this, but that one keys off a data attribute
     rather than the class, so the two do not collide. */
  <Link
    href="/"
    className="group flex min-w-0 flex-1 items-center gap-2 rounded-md text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden"
  >
    <BrandMark />
    <span className="truncate group-data-[collapsible=icon]:sr-only">
      {BRAND_NAME}
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
 * The collapse trigger sits on the identity row because that is what it acts
 * on: the whole panel. Beside the "Filters" label it read as a control over the
 * filters alone.
 *
 * Rows bleed to the sidebar edges and carry their own padding, so the divider
 * spans the full width while the text stays inside the margins.
 */
const SidebarHeaderBlock = ({
  active,
  activeCount,
  onClear,
  showClear,
}: SidebarHeaderBlockProps) => (
  <SidebarHeader className="gap-0 p-0">
    {/*
      A 3rem rail leaves about 16px of content width, not enough for a wordmark
      badge and a 28px trigger side by side; they overlapped. So when collapsed
      the wordmark gives way and the trigger becomes the single centred control.
    */}
    <div className="flex items-center gap-2 px-4 py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <SidebarWordmark />

      {/*
        Desktop only. Below `md` this sidebar is a Sheet that mounts only once
        open, so a trigger inside it could never be clicked. The toolbar renders
        the mobile equivalent, so exactly one of the two is present at any width.
      */}
      <SidebarTrigger
        className="hidden size-7 shrink-0 md:inline-flex"
        aria-label="Hide filters"
      />
    </div>

    <Separator />

    <div className="flex items-center justify-between gap-2 px-4 py-3">
      {/*
        `sr-only` rather than hidden when collapsed: the rail still belongs to a
        labelled region, and dropping the heading would leave the panel unnamed.
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

  /**
   * Per-facet explanation for a facet that cannot narrow results. Gymshark
   * publishes one vendor across 5,000 products and no tags at all, so those
   * checkboxes were either a no-op or absent with no explanation.
   */
  const redundantNotes = React.useMemo(() => {
    const notes: Partial<Record<RedundantFacet["facet"], string>> = {}

    for (const redundant of findRedundantFacets(options)) {
      notes[redundant.facet] = describeRedundantFacet(redundant)
    }

    return notes
  }, [options])

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

  const handleAvailabilityToggle = React.useCallback(
    (value: boolean) => {
      onFiltersChange({ ...filters, inStockOnly: value })
    },
    [filters, onFiltersChange]
  )

  const handleClear = React.useCallback(() => {
    onFiltersChange(EMPTY_FILTERS)
  }, [onFiltersChange])

  /**
   * How to switch each filter off, keyed by facet. Passed into `getAppliedChips`
   * so the chip list stays a pure function of `Filters`, which keeps the facet
   * enumeration in `lib/filters` and out of the sidebar.
   */
  const facetRemovers = React.useMemo<FacetRemovers>(
    () => ({
      vendors: (value: string) => handleToggle("vendors", value),
      productTypes: (value: string) => handleToggle("productTypes", value),
      tags: (value: string) => handleToggle("tags", value),
      priceRanges: (id: PriceRangeId) => handlePriceToggle(id),
      inStockOnly: () => handleAvailabilityToggle(false),
    }),
    [handleToggle, handlePriceToggle, handleAvailabilityToggle]
  )

  const appliedChips = React.useMemo(
    () => getAppliedChips(filters, facetRemovers),
    [filters, facetRemovers]
  )

  // Shown on the in-stock toggle so the control explains what it hides.
  const soldOutCount = React.useMemo(
    () =>
      products.reduce(
        (total, product) => total + (isSoldOut(product) ? 1 : 0),
        0
      ),
    [products]
  )

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
        <CollapsedFacetNav
          options={options}
          filters={filters}
          onToggle={handleToggle}
          onPriceToggle={handlePriceToggle}
          onAvailabilityToggle={handleAvailabilityToggle}
          soldOutCount={soldOutCount}
        />

        {/*
          Pinned above the scroll area rather than appended to the facet list.

          It used to sit at the bottom of the scrolling facets, below Tags. On
          any store with a few hundred tags that put the summary several
          thousand pixels below the fold, so a filter that had visibly narrowed
          the grid looked like it had not applied at all. Active filters are a
          summary of current state, so they belong to the fixed chrome next to
          the active count rather than in the scrolling region.

          `shrink-0` is load-bearing: without it a long facet list squeezes this
          block instead of the ScrollArea taking the overflow.
        */}
        {active && (
          <section
            aria-labelledby="active-filters"
            className="shrink-0 space-y-2 border-b px-4 py-3 group-data-[collapsible=icon]:hidden"
          >
            <h3 id="active-filters" className="text-sm font-medium">
              Applied
            </h3>
            {/*
              `aria-live` so the chip list is announced as it changes, not just
              the numeric count in the header. Removing a chip moves focus to
              the next control, so without this a screen reader user gets no
              confirmation the filter was dropped.
            */}
            <ul
              aria-live="polite"
              className="flex flex-wrap gap-1"
              aria-label="Applied filters"
            >
              {appliedChips.map((chip) => (
                <li key={chip.key}>
                  <AppliedChip label={chip.label} onRemove={chip.onRemove} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <ScrollArea className="flex-1 group-data-[collapsible=icon]:hidden">
          <div className="space-y-6 px-4 py-3 pb-8">
            <FacetSection
              icon={<Building2Icon className="size-4" />}
              title="Vendors"
              options={options.vendors}
              selected={filters.vendors}
              onToggle={(value) => handleToggle("vendors", value)}
              searchPlaceholder="Find a vendor"
              emptyMessage="No vendors match that search."
              redundantNote={redundantNotes.vendors}
            />

            <FacetSection
              icon={<PackageIcon className="size-4" />}
              title="Product types"
              options={options.productTypes}
              selected={filters.productTypes}
              onToggle={(value) => handleToggle("productTypes", value)}
              searchPlaceholder="Find a type"
              emptyMessage="No product types match that search."
              redundantNote={redundantNotes.productTypes}
            />

            <PriceFacet
              selected={filters.priceRanges}
              onToggle={handlePriceToggle}
            />

            <AvailabilityFacet
              inStockOnly={filters.inStockOnly}
              onToggle={handleAvailabilityToggle}
              soldOutCount={soldOutCount}
            />

            <FacetSection
              icon={<TagIcon className="size-4" />}
              title="Tags"
              options={options.tags}
              selected={filters.tags}
              onToggle={(value) => handleToggle("tags", value)}
              searchPlaceholder="Find a tag"
              emptyMessage="No tags match that search."
              redundantNote={redundantNotes.tags}
            />
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
    {/*
      The icon needs an explicit size. `Badge` sets `[&>svg]:size-3!`, but that
      only matches direct children, and this icon is a grandchild -- nested in
      the button -- so it kept lucide's 24px default inside a 20px badge and
      overflowed it.

      The negative margin cancels the added padding, so the larger hit area does
      not widen the chip: a 12px icon plus 8px padding is a 20px target, exactly
      the badge height, at no layout cost. The previous `p-0.5` gave 16px, under
      the 24px minimum.
    */}
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${label} filter`}
      className="-m-1 rounded-sm p-1 text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-secondary"
    >
      <XIcon className="size-3" aria-hidden="true" />
    </button>
  </Badge>
)
