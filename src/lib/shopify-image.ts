/**
 * Shopify CDN image resizing.
 *
 * Every storefront serves imagery from cdn.shopify.com, and that CDN resizes on
 * request: `_600x600` before the extension returns a 600px version.
 *
 *   Allbirds  4000x4000 PNG  2,688,385 bytes ->  26,348 bytes  (102x)
 *   Gymshark  1692x2018 JPG    182,370 bytes ->  18,238 bytes  (10x)
 *
 * Both render into a card about 300px wide.
 *
 * Not `next/image`: its default loader only optimises hosts in `remotePatterns`,
 * and the host is whichever store the user typed. A wildcard would make this an
 * open image proxy.
 */

/** Widths offered to the browser. The widest caps the largest request. */
const WIDTHS = [160, 320, 480, 640, 800] as const

const LARGEST = WIDTHS[WIDTHS.length - 1]

/** Mirrors the product grid's breakpoints: four at xl, three at lg, two at sm. */
const SIZES =
  "(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"

/** Only Shopify's CDN speaks this URL scheme. */
const supportsResize = (url: URL): boolean =>
  url.hostname === "cdn.shopify.com" || url.hostname.endsWith(".shopify.com")

/** Builds a resized URL, or null when the CDN will not honour one. */
const resized = (src: string, width: number): string | null => {
  let url: URL

  try {
    url = new URL(src)
  } catch {
    return null
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null
  if (!supportsResize(url)) return null

  const segment = url.pathname.split("/").pop()

  if (!segment) return null

  /*
    The extension is preserved exactly. Shopify only converts when the extension
    matches the source: a .png asked for as .webp 404s. Format negotiation is
    left to the Accept header, which already gets AVIF or WebP.
  */
  const extension = segment.match(/\.([a-z0-9]+)$/i)?.[1]

  if (!extension) return null

  const stem = segment.slice(0, -(extension.length + 1))

  // A name that already carries a size is left alone rather than stacked.
  if (/_\d+x\d*(_[a-z_]+)?$/i.test(stem)) return null

  const directory = url.pathname.slice(0, url.pathname.length - segment.length)

  url.pathname = `${directory}${stem}_${width}x${width}.${extension.toLowerCase()}`

  return url.toString()
}

/** What a product image should render as. */
export type ResolvedImage = {
  /** The URL to use as `src`. The largest candidate, or the original. */
  src: string
  /** A `srcset`, or empty when the CDN cannot resize this URL. */
  srcSet: string
  /** Only meaningful alongside `srcSet`. */
  sizes: string
}

/**
 * Resolves a storefront image URL into a responsive source set.
 *
 * Falls back to the original for a non-Shopify host, an unusable file name, or a
 * source smaller than the largest candidate. Shopify never upscales, so asking
 * for more pixels than exist returns the original and costs a request for
 * nothing.
 */
export const resolveProductImage = ({
  src,
  width,
}: {
  src: string
  width: number | null
}): ResolvedImage => {
  const original: ResolvedImage = { src, srcSet: "", sizes: "" }

  if (width !== null && width <= LARGEST) return original

  const candidates = WIDTHS.map((candidate) => {
    const url = resized(src, candidate)

    return url ? `${url} ${candidate}w` : null
  }).filter((entry): entry is string => entry !== null)

  if (candidates.length === 0) return original

  const largestUrl = candidates[candidates.length - 1].split(" ")[0]

  return { src: largestUrl, srcSet: candidates.join(", "), sizes: SIZES }
}
