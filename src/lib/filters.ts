import {
  getLowestVariantPrice,
  isInStock,
  parseTags,
  type ShopifyProduct,
} from "@/lib/shopify"

export type PriceRangeId =
  | "under-25"
  | "25-50"
  | "50-100"
  | "100-200"
  | "over-200"

export type PriceRange = {
  id: PriceRangeId
  label: string
  min: number
  max: number
}

export type Filters = {
  vendors: string[]
  productTypes: string[]
  tags: string[]
  priceRanges: PriceRangeId[]
  /**
   * Hide products where no variant is currently available.
   *
   * Off by default. Sold-out items are still real catalog entries and some
   * shoppers browse for them, but they should be opt-out rather than opt-in.
   */
  inStockOnly: boolean
}

export const EMPTY_FILTERS: Filters = {
  vendors: [],
  productTypes: [],
  tags: [],
  priceRanges: [],
  inStockOnly: false,
}

/**
 * Price buckets are matched on id, not on the label text. Matching labels meant
 * renaming a bucket silently broke every filter that referenced it.
 */
export const PRICE_RANGES: readonly PriceRange[] = [
  { id: "under-25", label: "Under $25", min: 0, max: 25 },
  { id: "25-50", label: "$25 to $50", min: 25, max: 50 },
  { id: "50-100", label: "$50 to $100", min: 50, max: 100 },
  { id: "100-200", label: "$100 to $200", min: 100, max: 200 },
  {
    id: "over-200",
    label: "Over $200",
    min: 200,
    max: Number.POSITIVE_INFINITY,
  },
] as const

export const getPriceRange = (id: PriceRangeId): PriceRange | undefined =>
  PRICE_RANGES.find((range) => range.id === id)

/**
 * Split a `product_type` path into its segments.
 *
 * Stores disagree about how to express a taxonomy in this field. Some send a
 * bare label ("Leggings"), others send a delimited path
 * ("Womens>Apparel>Leggings>full_length"). Gymshark sends the second, which
 * meant the facet offered one checkbox per full path and there was no way to
 * filter by "Leggings" at all.
 *
 * Only the `>` character is treated as a delimiter. Shopify's own type field
 * carries no standard, so guessing at `/`, `|` or `,` risks splitting labels
 * that legitimately contain them, and `,` in particular collides with tags.
 */
export const parseTypePath = (productType: string): string[] =>
  productType
    .split(">")
    .map((segment) => segment.trim())
    .filter(Boolean)

/**
 * Turn a machine identifier into display text.
 *
 * Taxonomy leaves are usually slug-shaped: `full_length`, `v_neck`, `track_top`.
 * Rendering those verbatim gives checkboxes reading "full_length", so the
 * separators become spaces and each word is capitalised. Deliberately shallow:
 * acronyms like "UV" or "TPE" would be mangled by title-casing, and no store
 * benefits enough from that to justify guessing.
 */
export const humanizeSlug = (value: string): string =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) =>
      word.length <= 2
        ? word.toUpperCase()
        : `${word.charAt(0).toUpperCase()}${word.slice(1)}`
    )
    .join(" ")

/**
 * The value a facet should key and display on for a product type.
 *
 * The leaf segment, humanized. `Womens>Apparel>Leggings>full_length` becomes
 * "Full Length", so the facet groups by what the thing actually is rather than
 * by which path it arrived on.
 */
export const getTypeFacetValue = (productType: string): string => {
  const segments = parseTypePath(productType)
  const leaf = segments.at(-1)

  if (!leaf) return ""

  return humanizeSlug(leaf)
}

/**
 * The value a facet should key and display on for a vendor.
 *
 * Some stores push a marketing tagline into `vendor` alongside the brand.
 * Gymshark sets `"Gymshark | Be a visionary."` on all 5,000 products, which
 * made the vendor facet a single checkbox reading the tagline and stamped that
 * tagline onto every product card. Trimming at the first pipe leaves the brand.
 *
 * A vendor with no pipe is returned untouched, and a genuinely empty one stays
 * empty so callers can drop it rather than filtering on "".
 */
export const getVendorFacetValue = (vendor: string): string => {
  const brand = vendor.split("|")[0]?.trim() ?? ""

  return brand
}

export type FilterOption = {
  value: string
  count: number
}

export type FilterOptions = {
  vendors: FilterOption[]
  productTypes: FilterOption[]
  tags: FilterOption[]
}

/**
 * A facet that cannot narrow anything, and the reason.
 *
 * A single-option facet is a checkbox that either keeps every product or none,
 * which is not a decision. Gymshark publishes one vendor across 5,000 products,
 * so its vendor facet was pure noise. Returning the reason lets the sidebar
 * explain the absence instead of just omitting it.
 */
export type RedundantFacet = {
  facet: "vendors" | "productTypes" | "tags"
  reason: "empty" | "single"
  option: string
}

/**
 * Build the sidebar's option lists with per-option counts, so a user can tell
 * "Acme (2)" apart from "Acme Industrial (900)" before clicking either.
 */
export const buildFilterOptions = (
  products: ShopifyProduct[]
): FilterOptions => {
  const vendors = new Map<string, number>()
  const productTypes = new Map<string, number>()
  const tags = new Map<string, number>()

  for (const product of products) {
    // Both facets key on a normalised value, not the raw field. `applyFilters`
    // normalises identically, so a checkbox and the filter behind it always
    // agree -- the alternative is a facet that lists "Full Length" and then
    // silently matches nothing.
    const vendor = getVendorFacetValue(product.vendor)

    if (vendor) {
      vendors.set(vendor, (vendors.get(vendor) ?? 0) + 1)
    }

    const productType = getTypeFacetValue(product.product_type)

    if (productType) {
      productTypes.set(productType, (productTypes.get(productType) ?? 0) + 1)
    }

    // A product counts once per tag even if the tag is somehow repeated.
    for (const tag of new Set(parseTags(product.tags))) {
      tags.set(tag, (tags.get(tag) ?? 0) + 1)
    }
  }

  const toSortedOptions = (counts: Map<string, number>): FilterOption[] =>
    Array.from(counts, ([value, count]) => ({ value, count })).sort(
      (a, b) => b.count - a.count || a.value.localeCompare(b.value)
    )

  return {
    vendors: toSortedOptions(vendors),
    productTypes: toSortedOptions(productTypes),
    tags: toSortedOptions(tags),
  }
}

/**
 * Facets that carry no signal for this catalog.
 *
 * Empty is a store that publishes nothing in that field -- Gymshark sends an
 * empty `tags` string on all 5,000 products. Single is a field with one
 * distinct value, which is technically a facet and practically a constant.
 *
 * `productTypes` is exempt from the single-value rule: a type is the one
 * dimension a catalog is nearly guaranteed to have many of, and a store with
 * exactly one type still benefits from seeing it named.
 */
export const findRedundantFacets = (
  options: FilterOptions
): RedundantFacet[] => {
  const redundant: RedundantFacet[] = []

  const check = (facet: RedundantFacet["facet"]) => {
    const list = options[facet]

    if (list.length === 0) {
      redundant.push({ facet, reason: "empty", option: "" })
      return
    }

    if (list.length === 1 && facet !== "productTypes") {
      redundant.push({ facet, reason: "single", option: list[0].value })
    }
  }

  check("vendors")
  check("productTypes")
  check("tags")

  return redundant
}

/** Human-readable explanation for a redundant facet, shown in the sidebar. */
export const describeRedundantFacet = (redundant: RedundantFacet): string => {
  if (redundant.reason === "empty") return "This store publishes none."

  return `Every product is ${redundant.option}, so this cannot narrow results.`
}

/**
 * Apply every facet with AND across facets and OR within a facet, which is the
 * convention users expect from faceted search.
 *
 * Products are bucketed by their *lowest* variant price, so a product with
 * $10 and $500 variants lands in "Under $25" rather than in both buckets.
 */
export const applyFilters = (
  products: ShopifyProduct[],
  filters: Filters
): ShopifyProduct[] => {
  const ranges = filters.priceRanges
    .map(getPriceRange)
    .filter((range): range is PriceRange => range !== undefined)

  return products.filter((product) => {
    if (filters.inStockOnly && !isInStock(product)) return false

    if (
      filters.vendors.length &&
      !filters.vendors.includes(getVendorFacetValue(product.vendor))
    ) {
      return false
    }

    if (
      filters.productTypes.length &&
      !filters.productTypes.includes(getTypeFacetValue(product.product_type))
    ) {
      return false
    }

    if (filters.tags.length) {
      const productTags = parseTags(product.tags)

      if (!filters.tags.some((tag) => productTags.includes(tag))) return false
    }

    if (ranges.length) {
      const price = getLowestVariantPrice(product.variants)

      if (price === null) return false
      if (!ranges.some((range) => price >= range.min && price < range.max)) {
        return false
      }
    }

    return true
  })
}

export const hasActiveFilters = (filters: Filters): boolean =>
  filters.inStockOnly ||
  filters.vendors.length > 0 ||
  filters.productTypes.length > 0 ||
  filters.tags.length > 0 ||
  filters.priceRanges.length > 0

export const countActiveFilters = (filters: Filters): number =>
  filters.vendors.length +
  filters.productTypes.length +
  filters.tags.length +
  filters.priceRanges.length +
  (filters.inStockOnly ? 1 : 0)

/** Label for the availability filter, shared by its facet row and its chip. */
export const AVAILABILITY_FILTER_LABEL = "Hide sold out"

/** Turns one active value back off, per facet. */
export type FacetRemovers = {
  vendors: (value: string) => void
  productTypes: (value: string) => void
  tags: (value: string) => void
  priceRanges: (id: PriceRangeId) => void
  inStockOnly: () => void
}

/**
 * One dismissible entry in the "Applied" summary.
 *
 * `key` is a React identity only. It is namespaced by facet so a vendor and a
 * product type that happen to share a string do not collide.
 */
export type AppliedFilterChip = {
  key: string
  label: string
  onRemove: () => void
}

/**
 * Flatten every active filter into one ordered list of chips.
 *
 * Derived from `Filters` in one place, on purpose. The sidebar previously
 * enumerated four of the five facets inline and forgot `inStockOnly`, so the
 * toggle counted towards "1 active" and narrowed the results while "Applied"
 * showed nothing -- a count that cannot be explained by anything on screen.
 *
 * Every facet on `Filters` must appear here, or the chip count drifts from
 * `countActiveFilters`: the header counts a filter that "Applied" then refuses
 * to show. Adding a facet to `Filters` means adding it to this list in the same
 * change -- the return value is the only place that knows the full set.
 */
export const getAppliedChips = (
  filters: Filters,
  removers: FacetRemovers
): AppliedFilterChip[] => {
  const chips: AppliedFilterChip[] = []

  const appendFacet = (
    keyPrefix: string,
    values: string[],
    onRemove: (value: string) => void
  ) => {
    for (const value of values) {
      chips.push({
        key: `${keyPrefix}-${value}`,
        label: value,
        onRemove: () => onRemove(value),
      })
    }
  }

  appendFacet("vendor", filters.vendors, removers.vendors)
  appendFacet("type", filters.productTypes, removers.productTypes)
  appendFacet("tag", filters.tags, removers.tags)

  for (const id of filters.priceRanges) {
    const range = getPriceRange(id)

    // Unreachable for ids that came from the price checkboxes, but skipping is
    // better than rendering a chip with no label.
    if (!range) continue

    chips.push({
      key: `price-${id}`,
      label: range.label,
      onRemove: () => removers.priceRanges(id),
    })
  }

  if (filters.inStockOnly) {
    chips.push({
      key: "availability",
      label: AVAILABILITY_FILTER_LABEL,
      onRemove: removers.inStockOnly,
    })
  }

  return chips
}

/** Case-insensitive search across title, vendor, type, tags and SKU. */
export const searchProducts = (
  products: ShopifyProduct[],
  query: string
): ShopifyProduct[] => {
  const term = query.trim().toLowerCase()

  if (!term) return products

  return products.filter((product) => {
    if (product.title.toLowerCase().includes(term)) return true
    if (product.vendor.toLowerCase().includes(term)) return true
    if (product.product_type.toLowerCase().includes(term)) return true
    // The humanized leaf as well, so searching "full length" or "full_length"
    // finds the product even though the raw field is a slug.
    if (getTypeFacetValue(product.product_type).toLowerCase().includes(term)) {
      return true
    }
    if (
      parseTags(product.tags).some((tag) => tag.toLowerCase().includes(term))
    ) {
      return true
    }

    return product.variants.some((variant) =>
      variant.sku?.toLowerCase().includes(term)
    )
  })
}

/** Toggle a value in one of the string-array facets. */
export const toggleValue = (values: string[], value: string): string[] =>
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
