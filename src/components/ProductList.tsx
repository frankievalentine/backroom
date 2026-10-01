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
import {
  formatPrice,
  getDiscountPercent,
  getPrimaryVariant,
  parseTags,
  type ShopifyProduct,
} from "@/lib/shopify"

const SKELETON_COUNT = 12
const VISIBLE_TAGS = 3

type ProductListProps = {
  products: ShopifyProduct[]
  domain: string
}

const ProductImage = ({ src, alt }: { src: string | null; alt: string }) => {
  // Track which URL failed rather than a bare boolean. Comparing against the
  // current `src` means a new image retries automatically, with no effect to
  // keep in sync -- the previous version needed one and could drift.
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null)

  if (!src || failedSrc === src) {
    return (
      <div
        className="flex aspect-square w-full items-center justify-center bg-muted"
        role="img"
        aria-label={alt}
      >
        <ImageOffIcon
          className="size-8 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(src)}
      className="aspect-square w-full bg-muted object-cover"
    />
  )
}

const ProductCard = ({
  product,
  domain,
}: {
  product: ShopifyProduct
  domain: string
}) => {
  const image = product.images[0] ?? null
  const variant = getPrimaryVariant(product.variants)
  const price = formatPrice(
    variant ? Number.parseFloat(variant.price) : Number.NaN
  )
  const discount = getDiscountPercent(variant)
  const tags = parseTags(product.tags)
  const href = buildProductUrl(domain, product.handle)
  const extraTagCount = tags.length - VISIBLE_TAGS

  return (
    <Card className="group/card relative overflow-hidden py-0 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
      <div className="relative">
        <ProductImage
          src={image?.src ?? null}
          alt={image?.alt || product.title || "Product image"}
        />

        {discount !== null && (
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

        {(product.vendor || product.product_type) && (
          <CardDescription className="truncate text-xs">
            {[product.vendor, product.product_type].filter(Boolean).join(" · ")}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="mt-auto">
        {price && (
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-base font-semibold tabular-nums">
              {price}
            </span>

            {variant?.compare_at_price && (
              <span className="text-xs text-muted-foreground line-through tabular-nums">
                {formatPrice(Number.parseFloat(variant.compare_at_price))}
              </span>
            )}
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
          className="absolute top-2 right-2 size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100"
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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} domain={domain} />
      ))}
    </div>
  )
}
