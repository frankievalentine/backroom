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
import { BRAND_INITIALS, BRAND_NAME } from "@/lib/brand"
import {
  buildFilterOptions,
  countActiveFilters,
  EMPTY_FILTERS,
  type FilterOption,
  type FilterOptions,
  type Filters,
  hasActiveFilters as filtersAreActive,
  PRICE_RANGES,
  type PriceRangeId,
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
      `<span>` by default so that an *enclosing* `<label>` can wrap it; this
      layout uses sibling `<label for>` pairs instead, and a `<span>` is not a
      labelable element, so the association silently did nothing. The docs call
      this out directly: use `nativeButton` with sibling labels.
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
 * Off by default, because sold-out items are still catalog entries. The count
 * of what the toggle hides is shown so the control explains itself before it is
 * used, rather than appearing to do nothing on a fully in-stock store.
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
            Hide sold out
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
 * A 3rem rail cannot show checkbox lists, so the full facets are hidden via
 * `group-data-[collapsible=icon]:hidden` and each facet becomes an icon that
 * opens its own popover. That keeps every filter reachable while collapsed,
 * rather than making the user expand the sidebar to change a single checkbox.
 *
 * A popover rather than a dialog: each of these is a short list, it needs no
 * title or confirm action, and a modal would be heavier than the interaction
 * warrants. Popover is also non-modal, so the rest of the rail stays reachable.
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
                  // Centres the icon in the 3rem rail. The button is a fixed
                  // 32px square inside a full-width list item, so without this
                  // it sat hard against the left edge.
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
  /** Hides the heading when the surrounding surface already provides one. */
  hideHeading?: boolean
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
  hideHeading = false,
}: FacetSectionProps) => {
  const [query, setQuery] = React.useState("")
  const [expanded, setExpanded] = React.useState(false)

  // `useId` because this facet is rendered twice: once in the sidebar and
  // again inside the collapsed rail's popover. A fixed id would be duplicated
  // in the document, and `aria-labelledby` would then resolve to the wrong one.
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
      {BRAND_INITIALS}
    </span>
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

  const handleAvailabilityToggle = React.useCallback(
    (value: boolean) => {
      onFiltersChange({ ...filters, inStockOnly: value })
    },
    [filters, onFiltersChange]
  )

  const handleClear = React.useCallback(() => {
    onFiltersChange(EMPTY_FILTERS)
  }, [onFiltersChange])

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
