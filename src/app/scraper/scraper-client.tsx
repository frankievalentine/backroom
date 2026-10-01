"use client"

import { AlertCircleIcon, SearchIcon, XIcon } from "lucide-react"
import * as React from "react"
import { FilterSidebar } from "@/components/FilterSidebar"
import { ProductGridSkeleton, ProductList } from "@/components/ProductList"
import { SitePicker } from "@/components/SitePicker"
import { SkipLink } from "@/components/SkipLink"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useSavedSites } from "@/hooks/use-saved-sites"
import { useStoreScrape } from "@/hooks/use-store-scrape"
import { applyFilters, EMPTY_FILTERS, searchProducts } from "@/lib/filters"
import type { ShopifyProduct } from "@/lib/shopify"

/** Products rendered per page. Keeps a large store from mounting 5,000 cards. */
const PAGE_SIZE = 60

const SIDEBAR_STATE_KEY = "product-scraper:sidebar-open"

/**
 * Persisted sidebar open/collapsed state.
 *
 * The registry's SidebarProvider writes a `sidebar_state` cookie but never reads
 * it back, so the initial state comes only from `defaultOpen` and a collapse does
 * not survive a reload. Controlling the provider from here fixes that without
 * editing the vendored component, which `shadcn add` would overwrite anyway.
 *
 * `null` means "not yet read". Rendering stays uncontrolled until the stored
 * value is known, because reading localStorage during the first render would
 * mismatch the server-rendered markup.
 */
const usePersistedSidebar = () => {
  const [open, setOpen] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_STATE_KEY)

      if (stored !== null) setOpen(stored === "true")
    } catch {
      // Unavailable storage: fall back to the provider's own default.
    }
  }, [])

  const handleOpenChange = React.useCallback((next: boolean) => {
    setOpen(next)

    try {
      window.localStorage.setItem(SIDEBAR_STATE_KEY, String(next))
    } catch {
      // See above.
    }
  }, [])

  return { open, handleOpenChange }
}

/** Shared by the skip link and the landmark it targets. */
const MAIN_CONTENT_ID = "main-content"

type ScraperClientProps = {
  /** `?domain=` read on the server, so the route can still server-render. */
  initialDomain?: string
}

export const ScraperClient = ({ initialDomain }: ScraperClientProps) => {
  const { sites, addSite, removeSite } = useSavedSites()
  const scrape = useStoreScrape()
  const { open: sidebarOpen, handleOpenChange: handleSidebarOpenChange } =
    usePersistedSidebar()

  const [filters, setFilters] = React.useState(EMPTY_FILTERS)
  const [query, setQuery] = React.useState("")
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE)

  const { domain, products, status, error, truncated, load } = scrape

  // A `?domain=` link from the home page loads that store on arrival. The param
  // is read on the server and handed in as a prop; the effect is keyed on the
  // raw value so editing the URL picks up a different store, and refetches only
  // when the value actually changes.
  React.useEffect(() => {
    if (!initialDomain) return

    void load(initialDomain)
  }, [initialDomain, load])

  const visibleProducts = React.useMemo<ShopifyProduct[]>(() => {
    const searched = searchProducts(products, query)
    const filtered = applyFilters(searched, filters)

    return filtered
  }, [products, query, filters])

  const visible = visibleProducts.slice(0, visibleCount)
  const hasMore = visibleProducts.length > visibleCount

  /*
    Reset the page window whenever the inputs behind the result set change.
    Done during render rather than in an effect, following React's documented
    "adjust state when props change" pattern: an effect would commit one frame
    with the previous window, briefly showing far more products than intended.
  */
  const resultKey = [
    products.length,
    query,
    filters.vendors.join(","),
    filters.productTypes.join(","),
    filters.tags.join(","),
    filters.priceRanges.join(","),
  ].join("|")

  const [previousResultKey, setPreviousResultKey] = React.useState(resultKey)

  if (previousResultKey !== resultKey) {
    setPreviousResultKey(resultKey)
    setVisibleCount(PAGE_SIZE)
  }

  const handleSelectSite = React.useCallback(
    async (nextDomain: string) => {
      setFilters(EMPTY_FILTERS)
      setQuery("")
      await load(nextDomain)
    },
    [load]
  )

  const handleSubmitDomain = React.useCallback(
    async (rawInput: string) => {
      const savedDomain = await load(rawInput)

      // Save the canonical domain the server returned, never the raw input.
      // This is what prevents "https://www.x.com" and "x.com" landing in the
      // list as two separate entries.
      if (savedDomain) addSite(savedDomain)
    },
    [addSite, load]
  )

  const handleRemoveSite = React.useCallback(
    (removedDomain: string) => {
      removeSite(removedDomain)

      if (domain === removedDomain) scrape.reset()
    },
    [domain, removeSite, scrape]
  )

  const handleClearFilters = React.useCallback(() => {
    setFilters(EMPTY_FILTERS)
    setQuery("")
  }, [])

  const isLoading = status === "loading"
  const hasProducts = products.length > 0
  const showResults = !isLoading && hasProducts && visibleProducts.length > 0
  const showNoMatches =
    !isLoading && hasProducts && visibleProducts.length === 0

  return (
    <SidebarProvider
      open={sidebarOpen ?? undefined}
      onOpenChange={handleSidebarOpenChange}
    >
      {/*
        One `<h1>` per route, always present and always first in DOM order, so a
        reader navigating by heading meets the page title before the sidebar's
        `<h2>Filters</h2>`. It is visually hidden because the meaningful visible
        title changes with state (loaded domain, error, empty), and swapping a
        visible heading on every transition would be worse for orientation than a
        stable one. `sr-only` positions it absolutely, so it takes no space in
        the sidebar's flex layout.
      */}
      <h1 className="sr-only">
        {domain
          ? `Product catalogue for ${domain}`
          : "Shopify product catalogue scraper"}
      </h1>

      <FilterSidebar
        products={products}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <SidebarInset id={MAIN_CONTENT_ID}>
        <div className="flex min-h-svh flex-col">
          <SkipLink targetId={MAIN_CONTENT_ID} />

          {/*
            No navbar on this route. The wordmark lives in the sidebar header
            instead, so the tool gets the full height for its own content rather
            than sharing the top of the screen with a header that only repeated
            the home page.

            Toolbar. The filter trigger is here rather than in the sidebar for
            one concrete reason: on mobile the sidebar is a Sheet that only
            mounts once open, so a trigger inside it could never be reached.
            Below `md` the sidebar trigger is hidden and this one is the only
            way to the filters.
          */}
          <div className="border-b bg-background">
            <div className="mx-auto flex w-full max-w-7xl items-start gap-3 px-5 py-4 sm:px-8">
              <SidebarTrigger
                className="mt-0.5 shrink-0 md:hidden"
                aria-label="Show filters"
              />

              <div className="min-w-0 flex-1">
                <SitePicker
                  sites={sites}
                  selectedDomain={domain}
                  status={status}
                  inputError={status === "error" ? error : null}
                  onSelect={handleSelectSite}
                  onSubmitDomain={handleSubmitDomain}
                  onRemoveSite={handleRemoveSite}
                />
              </div>
            </div>
          </div>

          {/*
              A `<div>`, not a `<main>`: SidebarInset above is already the page's
              single main landmark, and nesting a second one leaves assistive tech
              with nothing to treat as the page body.
            */}
          <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
            {error && status === "error" && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircleIcon aria-hidden="true" />
                <AlertTitle>Could not load this store</AlertTitle>
                <AlertDescription className="text-pretty">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {truncated && (
              <Alert className="mb-6">
                <AlertTitle>Showing a partial catalogue</AlertTitle>
                <AlertDescription className="text-pretty">
                  This store has more products than one scrape can reach. The
                  counts below are a lower bound.
                </AlertDescription>
              </Alert>
            )}

            {hasProducts && (
              <div className="mb-6 flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h2 className="text-base font-medium">
                    {visibleProducts.length.toLocaleString()}{" "}
                    {visibleProducts.length === 1 ? "product" : "products"}
                    {domain && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        from {domain}
                      </span>
                    )}
                  </h2>

                  {products.length !== visibleProducts.length && (
                    <p className="text-sm tabular-nums text-muted-foreground">
                      {products.length.toLocaleString()} loaded
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative min-w-0 flex-1 sm:max-w-xs">
                    <SearchIcon
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search products"
                      aria-label="Search loaded products"
                      className="pl-8"
                    />
                  </div>

                  {query && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuery("")}
                      className="gap-1"
                    >
                      <XIcon aria-hidden="true" />
                      Clear search
                    </Button>
                  )}
                </div>
              </div>
            )}

            {isLoading && <ProductGridSkeleton />}

            {showResults && (
              <>
                <ProductList products={visible} domain={domain ?? ""} />

                {hasMore && (
                  <div className="mt-8 flex flex-col items-center gap-3">
                    <p className="text-sm tabular-nums text-muted-foreground">
                      Showing {visible.length.toLocaleString()} of{" "}
                      {visibleProducts.length.toLocaleString()}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setVisibleCount((count) => count + PAGE_SIZE)
                      }
                    >
                      Load{" "}
                      {Math.min(
                        PAGE_SIZE,
                        visibleProducts.length - visibleCount
                      ).toLocaleString()}{" "}
                      more
                    </Button>
                  </div>
                )}
              </>
            )}

            {showNoMatches && (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <SearchIcon aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>No products match</EmptyTitle>
                  <EmptyDescription>
                    {products.length.toLocaleString()}{" "}
                    {products.length === 1 ? "product" : "products"} loaded,
                    none matching the current filters.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearFilters}
                  >
                    Clear filters and search
                  </Button>
                </EmptyContent>
              </Empty>
            )}

            {!hasProducts && !isLoading && status === "idle" && (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <SearchIcon aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>No store loaded</EmptyTitle>
                  <EmptyDescription>
                    Enter a Shopify storefront above to pull its full product
                    catalogue. Nothing is stored on our servers.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

            {!hasProducts && !isLoading && status === "error" && (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <AlertCircleIcon aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>Nothing to show yet</EmptyTitle>
                  <EmptyDescription>
                    Check the domain and try again. Some stores block automated
                    requests entirely, which we cannot work around.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
