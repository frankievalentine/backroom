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
   * Hide products where no variant is available. Off by default: sold-out items
   * are real catalog entries and should be opt-out.
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
 * Price buckets, matched on id rather than label so renaming one cannot silently
 * break every filter referencing it.
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
 * Split a `product_type` into segments.
 *
 * Only `>` is treated as a delimiter: the field carries no standard, so guessing
 * at `/` or `|` risks splitting labels that legitimately contain them, and `,`
 * collides with tags.
 */
export const parseTypePath = (productType: string): string[] =>
  productType
    .split(">")
    .map((segment) => segment.trim())
    .filter(Boolean)

/**
 * Slug to display text: `full_length` becomes `Full Length`.
 *
 * Short words are uppercased rather than title-cased so acronyms like "UV" and
 * "TPE" survive. Deeper unwrapping is not worth guessing at.
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
 * The leaf of the type path, humanized, so the facet groups by what the product
 * is rather than by the path it arrived on.
 */
export const getTypeFacetValue = (productType: string): string => {
  const segments = parseTypePath(productType)
  const leaf = segments.at(-1)

  if (!leaf) return ""

  return humanizeSlug(leaf)
}

/**
 * The brand up to the first pipe.
 *
 * Stores push taglines into `vendor`; Gymshark sets "Gymshark | Be a visionary."
 * on all 5,000 products. Empty stays empty so callers can drop it rather than
 * filtering on "".
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
 * A facet that cannot narrow anything, and why. A single-option facet is a
 * checkbox that either keeps every product or none, which is not a decision.
 */
export type RedundantFacet = {
  facet: "vendors" | "productTypes" | "tags"
  reason: "empty" | "single"
  option: string
}

/**
 * Option lists with counts, so a user can tell "Acme (2)" from
 * "Acme Industrial (900)" before clicking either.
 *
 * Both text facets key on the normalised value, not the raw field. `applyFilters`
 * normalises identically, which is what stops a checkbox labelled "Full Length"
 * from silently matching nothing.
 */
export const buildFilterOptions = (
  products: ShopifyProduct[]
): FilterOptions => {
  const vendors = new Map<string, number>()
  const productTypes = new Map<string, number>()
  const tags = new Map<string, number>()

  for (const product of products) {
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
 * Facets carrying no signal: empty (the store publishes none) or single (one
 * distinct value, so technically a facet and practically a constant).
 *
 * `productTypes` is exempt from the single-value rule: a catalog nearly always
 * has many, and naming the one it has is still useful.
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
 * AND across facets, OR within one, which is what faceted search implies.
 *
 * Price buckets on the *lowest* variant price, so a product with $10 and $500
 * variants lands in "Under $25" rather than both.
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
 * One dismissible entry in the "Applied" summary. `key` is a React identity
 * only, namespaced by facet so a vendor and a type sharing a string cannot
 * collide.
 */
export type AppliedFilterChip = {
  key: string
  label: string
  onRemove: () => void
}

/**
 * Every active filter as one ordered list of chips.
 *
 * Every facet on `Filters` must appear here. Omitting one makes the header count
 * a filter "Applied" refuses to show, which is what happened when this forgot
 * `inStockOnly`. Add a facet and add it here in the same change.
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

    // Unreachable from the price checkboxes, but a chip with no label is worse
    // than no chip at all.
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
    // Also the humanized leaf, so "full length" finds what the slug hid.
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
