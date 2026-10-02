"use client"

import { ExternalLinkIcon, ImageOffIcon } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { buildProductUrl } from "@/lib/domain"
import { isSponsoredDomain } from "@/lib/featured"
import { getTypeFacetValue, getVendorFacetValue } from "@/lib/filters"
import {
  formatPrice,
  getDiscountPercent,
  getPrimaryVariant,
  isFree,
  isSoldOut,
  parseTags,
  type ShopifyProduct,
} from "@/lib/shopify"
import { resolveProductImage } from "@/lib/shopify-image"

const SKELETON_COUNT = 12
const VISIBLE_TAGS = 3

type ProductListProps = {
  products: ShopifyProduct[]
  domain: string
}

const ProductImage = ({
  src,
  alt,
  width,
  height,
}: {
  src: string | null
  alt: string
  width: number | null
  height: number | null
}) => {
  // Track which URL failed rather than a bare boolean. Comparing against the
  // current `src` means a new image retries automatically, with no effect to
  // keep in sync -- the previous version needed one and could drift.
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null)

  if (!src || failedSrc === src) {
    return (
      /*
        The placeholder needs to read as an image slot rather than a hole in the
        card. `bg-muted` sits only a shade away from `bg-card` in dark mode, so
        the surface alone was invisible; the dashed inset draws the boundary and
        the icon confirms what the area is for.
      */
      <div
        className="flex aspect-square w-full items-center justify-center border-b border-dashed border-border bg-muted/40"
        role="img"
        aria-label={alt}
      >
        <ImageOffIcon
          className="size-6 text-muted-foreground/70"
          aria-hidden="true"
        />
      </div>
    )
  }

  /*
    Resized through the Shopify CDN rather than next/image, because the host is
    whichever store the user typed and cannot be allowlisted. See
    src/lib/shopify-image.ts for the measurements.

    `width`/`height` are the declared source dimensions, not the rendered size.
    The card is aspect-square and `object-cover`, so the browser only needs the
    ratio to reserve space; giving it the source ratio avoids reserving a box in
    the wrong shape for images whose width and height are missing.
  */
  const resolved = resolveProductImage({ src, width })

  /*
    The declared ratio is applied only when the payload carries both dimensions.
    A source that reports just a width would otherwise reserve a wrong-shaped
    box, and `aspect-square` already covers the case where neither is known.
  */
  const declaredRatio = width && height ? width / height : null

  return (
    <img
      src={resolved.src}
      srcSet={resolved.srcSet || undefined}
      sizes={resolved.sizes || undefined}
      alt={alt}
      loading="lazy"
      decoding="async"
      width={width ?? undefined}
      height={height ?? undefined}
      style={declaredRatio ? { aspectRatio: declaredRatio } : undefined}
      onError={() => setFailedSrc(src)}
      className="aspect-square w-full bg-muted object-cover"
    />
  )
}

const ProductCard = ({
  product,
  domain,
  sponsored,
}: {
  product: ShopifyProduct
  domain: string
  sponsored: boolean
}) => {
  const image = product.images[0] ?? null
  const variant = getPrimaryVariant(product.variants)
  const discount = getDiscountPercent(variant)
  const tags = parseTags(product.tags)
  const href = buildProductUrl(
    domain,
    product.handle,
    true,
    sponsored ? "sponsored" : "referral"
  )
  const extraTagCount = tags.length - VISIBLE_TAGS

  /*
    Availability drives what the price line says.

    A sold-out product must not show a price. Merely having a price is not
    evidence of availability -- most sold-out products keep their real price in
    the payload, and the rest are zeroed -- so "$0.00" was reading as a data bug
    rather than as "you cannot buy this". "Free" is separated from "Sold out"
    because a genuinely free, available product is not a broken one.
  */
  const soldOut = isSoldOut(product)
  const free = isFree(product)
  const price = soldOut
    ? null
    : formatPrice(variant ? Number.parseFloat(variant.price) : Number.NaN)

  return (
    <Card className="group/card relative overflow-hidden py-0 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
      <div className="relative">
        <ProductImage
          src={image?.src ?? null}
          alt={image?.alt || product.title || "Product image"}
          width={image?.width ?? null}
          height={image?.height ?? null}
        />

        {/*
          A discount on a product nobody can buy is noise, so the badge is
          suppressed when sold out for the same reason the price is. Sold-out
          state is carried by the price line below as well, so the badge is a
          second cue rather than the only one.
        */}
        {!soldOut && discount !== null && (
          <Badge
            variant="secondary"
            className="absolute top-2 left-2 bg-background/90 tabular-nums backdrop-blur-sm"
          >
            {discount}% off
          </Badge>
        )}
      </div>

      <CardHeader className="gap-1.5">
        <CardTitle className="line-clamp-2 text-sm font-medium">
          {/* The whole card is a link target, so the accessible name is the
              product title. A real anchor keeps middle-click, copy-link and
              keyboard activation working; a div with onClick had none of them. */}
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:outline-none"
            >
              <span className="line-clamp-2">{product.title}</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            product.title
          )}
        </CardTitle>

        {/*
          Both fields go through the same normalisation the facets use, and
          near-duplicates are dropped.

          Two store habits break the naive `vendor + product_type` line. Gymshark
          sets `vendor` to "Gymshark | Be a visionary." on all 5,000 products,
          so every card repeated a marketing tagline, and its `product_type` is
          a delimited taxonomy path ("Womens>Apparel>Leggings>full_length")
          rather than a label. Normalising fixes both; the de-dupe is for the
          case where the two fields collapse to the same string.
        */}
        {(() => {
          const parts = [
            getVendorFacetValue(product.vendor),
            getTypeFacetValue(product.product_type),
          ].filter(
            (part, index, all) => part.length > 0 && all.indexOf(part) === index
          )

          if (!parts.length) return null

          return (
            <CardDescription className="truncate text-xs">
              {parts.join(" · ")}
            </CardDescription>
          )
        })()}
      </CardHeader>

      {/*
        `pb-4` rather than relying on the card's own vertical padding: the
        footer suppresses it (`has-data-[slot=card-footer]:pb-0`) and products
        without tags have no footer, so the price sat hard against the card edge.
      */}
      <CardContent className="mt-auto pb-4">
        {price && (
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-base font-semibold tabular-nums text-price">
              {price}
            </span>

            {/*
              Only when the compare-at price is genuinely higher. Stores
              routinely leave `compare_at_price` populated at the same value as
              the price, and striking through an identical figure advertises a
              discount that does not exist. `getDiscountPercent` already encodes
              that rule and returns null for equal or inverted prices, so it
              gates the whole treatment, badge included.
            */}
            {discount !== null && (
              <span className="text-xs text-muted-foreground line-through tabular-nums">
                {formatPrice(
                  Number.parseFloat(variant?.compare_at_price ?? "")
                )}
              </span>
            )}
          </p>
        )}

        {free && <p className="text-base font-semibold text-price">Free</p>}

        {soldOut && (
          <p className="text-sm font-medium text-muted-foreground">
            Sold out
            <span className="sr-only">
              . This product cannot currently be bought.
            </span>
          </p>
        )}
      </CardContent>

      {tags.length > 0 && (
        <CardFooter className="gap-1">
          <ul className="flex flex-wrap gap-1">
            {tags.slice(0, VISIBLE_TAGS).map((tag) => (
              <li key={tag}>
                <Badge variant="secondary" className="text-xs font-normal">
                  {tag}
                </Badge>
              </li>
            ))}
          </ul>

          {extraTagCount > 0 && (
            <Badge
              variant="outline"
              className="text-xs font-normal tabular-nums"
              title={tags.slice(VISIBLE_TAGS).join(", ")}
            >
              +{extraTagCount}
              <span className="sr-only">
                {" "}
                more tags: {tags.slice(VISIBLE_TAGS).join(", ")}
              </span>
            </Badge>
          )}
        </CardFooter>
      )}

      {href && (
        <ExternalLinkIcon
          aria-hidden="true"
          className="absolute top-2 right-2 size-3.5 text-muted-foreground opacity-0 transition-opacity motion-reduce:transition-none group-hover/card:opacity-100 group-focus-within/card:opacity-100"
        />
      )}
    </Card>
  )
}

/** Placeholder grid shown while a store is loading. */
export const ProductGridSkeleton = () => (
  <div
    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
    role="status"
    aria-busy="true"
    aria-live="polite"
    aria-label="Loading products"
  >
    {Array.from({ length: SKELETON_COUNT }, (_, index) => (
      // The skeleton list never reorders, so the index is a stable key.
      <Card key={index} className="overflow-hidden py-0">
        <Skeleton className="aspect-square w-full rounded-none" />
        <CardHeader className="gap-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-1/3" />
        </CardContent>
      </Card>
    ))}
  </div>
)

export const ProductList = ({ products, domain }: ProductListProps) => {
  if (products.length === 0) return null

  // ProductList is already a client component; keep the CMS predicate here and
  // pass a plain boolean to cards instead of coupling ProductCard to placements.
  const sponsored = isSponsoredDomain(domain)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          domain={domain}
          sponsored={sponsored}
        />
      ))}
    </div>
  )
}
