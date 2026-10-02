/**
 * Shopify payload shape and the helpers that read it.
 */

export type ShopifyImage = {
  id: number
  src: string
  alt: string | null
  width: number | null
  height: number | null
}

export type ShopifyVariant = {
  id: number
  title: string
  price: string
  sku: string | null
  compare_at_price: string | null
  /**
   * Whether the variant can currently be bought.
   *
   * Present on the public `/products.json` payload, which is the only
   * availability signal without an authenticated Admin API call.
   */
  available: boolean
}

export type ShopifyProduct = {
  id: number
  title: string
  handle: string
  vendor: string
  product_type: string
  created_at: string
  updated_at: string
  published_at: string | null
  tags: string
  variants: ShopifyVariant[]
  images: ShopifyImage[]
}

/** Tags arrive as a comma separated string. Parsed once, always trimmed. */
export const parseTags = (tags: unknown): string[] => {
  if (typeof tags !== "string" || !tags.trim()) return []

  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

/**
 * Whether any variant can currently be bought.
 *
 * Price cannot stand in for availability: sold-out products keep their real
 * price in the payload.
 */
export const isInStock = (product: ShopifyProduct): boolean =>
  product.variants.some((variant) => variant.available)

export const isSoldOut = (product: ShopifyProduct): boolean =>
  !isInStock(product)

/**
 * Available at no cost. Distinct from sold out, and worth the distinction: a
 * genuinely free product showing "$0.00" reads as a bug, "Free" does not.
 */
export const isFree = (product: ShopifyProduct): boolean =>
  isInStock(product) && getLowestVariantPrice(product.variants) === 0

/** Lowest variant price, for filtering and display. Null when none parse. */
export const getLowestVariantPrice = (
  variants: ShopifyVariant[]
): number | null => {
  const prices = variants
    .map((variant) => Number.parseFloat(variant.price))
    .filter((price) => Number.isFinite(price))

  if (!prices.length) return null

  return Math.min(...prices)
}

/** The variant whose price is shown on the product card. */
export const getPrimaryVariant = (
  variants: ShopifyVariant[]
): ShopifyVariant | null => {
  if (!variants.length) return null

  const purchasable = variants.filter((variant) => variant.available)
  const candidates = purchasable.length ? purchasable : variants
  const lowest = getLowestVariantPrice(candidates)

  if (lowest === null) return candidates[0]

  return (
    candidates.find((variant) => Number.parseFloat(variant.price) === lowest) ??
    candidates[0]
  )
}

export const getCompareAtPrice = (
  variant: ShopifyVariant | null
): number | null => {
  if (!variant?.compare_at_price) return null

  const value = Number.parseFloat(variant.compare_at_price)

  return Number.isFinite(value) ? value : null
}

export const formatPrice = (value: number | null): string | null => {
  if (value === null || !Number.isFinite(value)) return null

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

/**
 * Percentage saved versus the compare-at price, or null when not discounted.
 * Guards against a zero or inverted compare-at price.
 */
export const getDiscountPercent = (
  variant: ShopifyVariant | null
): number | null => {
  const compareAt = getCompareAtPrice(variant)

  if (!variant || compareAt === null) return null

  const price = Number.parseFloat(variant.price)

  if (!Number.isFinite(price) || compareAt <= price) return null

  return Math.round(((compareAt - price) / compareAt) * 100)
}

/**
 * Normalise a raw `products.json` payload.
 *
 * The response varies by theme and app version: `images` can be missing, `image`
 * can be null, and several fields are absent entirely. Doing this once at the
 * boundary keeps every consumer on one predictable shape.
 */
export const normalizeProduct = (raw: unknown): ShopifyProduct | null => {
  if (!raw || typeof raw !== "object") return null

  const product = raw as Record<string, unknown>

  if (typeof product.id !== "number" || typeof product.title !== "string") {
    return null
  }

  const images = Array.isArray(product.images)
    ? product.images
        .filter(
          (image): image is ShopifyImage =>
            Boolean(image) && typeof image === "object"
        )
        .map((image) => ({
          id: Number(image.id) || 0,
          src: typeof image.src === "string" ? image.src : "",
          alt: typeof image.alt === "string" ? image.alt : null,
          width: typeof image.width === "number" ? image.width : null,
          height: typeof image.height === "number" ? image.height : null,
        }))
        .filter((image) => image.src.length > 0)
    : []

  // Older themes send a single `image`; fold it in so the UI has one path.
  if (!images.length && product.image && typeof product.image === "object") {
    const image = product.image as Record<string, unknown>

    if (typeof image.src === "string" && image.src.length > 0) {
      images.push({
        id: Number(image.id) || 0,
        src: image.src,
        alt: typeof image.alt === "string" ? image.alt : null,
        width: typeof image.width === "number" ? image.width : null,
        height: typeof image.height === "number" ? image.height : null,
      })
    }
  }

  const variants = Array.isArray(product.variants)
    ? product.variants
        .filter(
          (variant): variant is ShopifyVariant =>
            Boolean(variant) && typeof variant === "object"
        )
        .map((variant) => ({
          id: Number(variant.id) || 0,
          title: typeof variant.title === "string" ? variant.title : "Default",
          price: typeof variant.price === "string" ? variant.price : "0",
          sku: typeof variant.sku === "string" ? variant.sku : null,
          compare_at_price:
            typeof variant.compare_at_price === "string"
              ? variant.compare_at_price
              : null,
          // Absent on older themes. Treated as available so a store that omits
          // the flag does not read as entirely sold out.
          available: variant.available !== false,
        }))
    : []

  return {
    id: product.id,
    title: product.title,
    handle: typeof product.handle === "string" ? product.handle : "",
    vendor: typeof product.vendor === "string" ? product.vendor : "",
    product_type:
      typeof product.product_type === "string" ? product.product_type : "",
    created_at:
      typeof product.created_at === "string" ? product.created_at : "",
    updated_at:
      typeof product.updated_at === "string" ? product.updated_at : "",
    published_at:
      typeof product.published_at === "string" ? product.published_at : null,
    tags: typeof product.tags === "string" ? product.tags : "",
    variants,
    images,
  }
}

export const normalizeProducts = (raw: unknown): ShopifyProduct[] => {
  if (!Array.isArray(raw)) return []

  return raw
    .map(normalizeProduct)
    .filter((product): product is ShopifyProduct => product !== null)
}
