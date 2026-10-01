"use client"

import {
  Building2Icon,
  DollarSignIcon,
  PackageIcon,
  TagIcon,
  XIcon,
} from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar"
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
      <Sidebar className="bg-sidebar" aria-label="Filters">
        <SidebarHeader className="px-4 py-4">
          <h2 className="text-sm font-medium">Filters</h2>
        </SidebarHeader>
        <SidebarContent>
          <p className="px-4 text-sm text-muted-foreground">
            Filters appear once a store is loaded.
          </p>
        </SidebarContent>
      </Sidebar>
    )
  }

  return (
    <Sidebar className="bg-sidebar" aria-label="Filters">
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">
            Filters
            {active && (
              <span className="ml-2 text-xs font-normal tabular-nums text-muted-foreground">
                {activeCount} active
              </span>
            )}
          </h2>

          {active && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 gap-1 px-2 text-xs"
            >
              <XIcon aria-hidden="true" />
              Clear
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="flex-1">
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
