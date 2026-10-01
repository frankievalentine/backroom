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
    if (product.vendor) {
      vendors.set(product.vendor, (vendors.get(product.vendor) ?? 0) + 1)
    }

    if (product.product_type) {
      productTypes.set(
        product.product_type,
        (productTypes.get(product.product_type) ?? 0) + 1
      )
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

    if (filters.vendors.length && !filters.vendors.includes(product.vendor)) {
      return false
    }

    if (
      filters.productTypes.length &&
      !filters.productTypes.includes(product.product_type)
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
