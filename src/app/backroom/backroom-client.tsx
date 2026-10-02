"use client"

import { AlertCircleIcon, SearchIcon, XIcon } from "lucide-react"
import * as React from "react"
import { Suspense, use } from "react"

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
import type { StoreReadResult } from "@/lib/store-read"

/** Products rendered per page. Keeps a large store from mounting 5,000 cards. */
const PAGE_SIZE = 60

const SIDEBAR_STATE_KEY = "backroom:sidebar-open"

/**
 * Persisted sidebar open/collapsed state.
 *
 * The registry's SidebarProvider writes a `sidebar_state` cookie but never reads
 * it back, so a collapse does not survive a reload. Controlling it here fixes
 * that without editing the vendored component. `null` means "not yet read":
 * rendering stays uncontrolled until the stored value is known, because reading
 * localStorage during first render would mismatch the server markup.
 */
const usePersistedSidebar = () => {
  const [open, setOpen] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_STATE_KEY)

    setOpen(stored === null ? null : stored === "true")
  }, [])

  const handleOpenChange = React.useCallback((next: boolean) => {
    setOpen(next)
    window.localStorage.setItem(SIDEBAR_STATE_KEY, String(next))
  }, [])

  return { open, handleOpenChange }
}

const MAIN_CONTENT_ID = "main-content"

type CatalogViewerProps = {
  /** Canonical domain from `?domain=`, normalised on the server. */
  initialDomain: string | null
  /** Set when the server rejected the param, so no read is attempted. */
  initialError: string | null
  /**
   * The in-flight read, or null when nothing was requested.
   *
   * This is passed to `StreamedProducts` rather than read here, and that is the
   * whole point of the split. `use()` suspends the component that calls it, and
   * anything inside its Suspense fallback is thrown away -- so suspending in
   * this component would replace the sidebar, the `<main>` landmark and the
   * `<h1>` with skeletons until the read finished. Suspending a leaf instead
   * lets the page render immediately and stream the grid into it.
   */
  store: Promise<StoreReadResult> | null
}

export const CatalogViewer = ({
  initialDomain,
  initialError,
  store,
}: CatalogViewerProps) => {
  const { sites, addSite, removeSite } = useSavedSites()
  const scrape = useStoreScrape()
  const { open: sidebarOpen, handleOpenChange: handleSidebarOpenChange } =
    usePersistedSidebar()

  const [filters, setFilters] = React.useState(EMPTY_FILTERS)
  const [query, setQuery] = React.useState("")
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE)

  const { domain, products, status, error, truncated, load } = scrape

  /*
    The hook only takes over once the user does something; until then the
    streamed read is the source of truth. One source per state rather than two
    to reconcile: `products` is null while idle, which is what tells
    StreamedProducts to await the promise.

    `streamed` is the exception. It is the resolved read, lifted here so the
    sidebar can see it -- the sidebar sits outside the Suspense boundary and
    cannot await the promise itself, so without this it would sit on "Filters
    appear once a store is loaded" while the grid below showed 60 products.
  */
  const [streamed, setStreamed] = React.useState<{
    domain: string
    products: ShopifyProduct[]
  } | null>(null)

  const liveDomain = domain ?? streamed?.domain ?? initialDomain

  const liveProducts =
    status === "idle" ? (streamed?.products ?? null) : products

  /*
    Adopts the streamed read once it resolves.

    StreamedProducts calls this because it is the only component that knows when
    the promise settled. Saves the store on success only, so a `?domain=` that
    turned out not to be Shopify never reaches a saved list.

    An effect rather than a save during render, because `useSavedSites` defers
    its localStorage read to an effect too. Saving during render would see an
    empty list and race the hydration effect about to overwrite state with
    whatever was already stored, dropping the store just added.
  */
  const handleStreamedStoreLoaded = React.useCallback(
    (loadedDomain: string, loadedProducts: ShopifyProduct[]) => {
      setStreamed({ domain: loadedDomain, products: loadedProducts })
      addSite(loadedDomain)
    },
    [addSite]
  )

  const liveError = status === "error" ? error : initialError
  const liveTruncated = status === "idle" ? false : truncated
  const liveStatus = status

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

      // Save the canonical domain the server returned, never the raw input, so
      // "https://www.x.com" and "x.com" cannot land as two separate entries.
      if (savedDomain) addSite(savedDomain)
    },
    [addSite, load]
  )

  const handleRemoveSite = React.useCallback(
    (removedDomain: string) => {
      removeSite(removedDomain)

      if (liveDomain === removedDomain) scrape.reset()
    },
    [liveDomain, removeSite, scrape]
  )

  const handleClearFilters = React.useCallback(() => {
    setFilters(EMPTY_FILTERS)
    setQuery("")
  }, [])

  const handleAvailabilityToggle = React.useCallback(() => {
    setFilters((current) => ({
      ...current,
      inStockOnly: !current.inStockOnly,
    }))
  }, [])

  const isLoading = liveStatus === "loading"

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
        {liveDomain
          ? `Product catalog for ${liveDomain}`
          : "Shopify product catalog viewer"}
      </h1>

      {/*
          Rendered with an empty array until the streamed read lands, because the
          sidebar is outside the Suspense boundary that awaits it. It shows its
          own "Filters appear once a store is loaded" state for that window and
          then fills in.

          This is the compromise that keeps the shell streaming: the sidebar is
          chrome, not results, so it must not suspend. The facets arrive a
          fraction after the grid rather than with it, which is barely
          noticeable and far better than replacing the whole workspace with a
          skeleton.
        */}
      <FilterSidebar
        products={liveProducts ?? []}
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
                  selectedDomain={liveDomain}
                  status={liveStatus}
                  inputError={liveStatus === "error" ? liveError : null}
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
            {/*
              The Suspense boundary wraps the results area and nothing else.
              Everything above it -- sidebar, toolbar, heading, landmarks -- is
              already in the HTML the server sent, so the page is usable while
              the read is still walking the store's pagination.
            */}
            <Suspense fallback={<ProductGridSkeleton />}>
              <StreamedProducts
                store={liveProducts ? null : store}
                products={liveProducts}
                initialError={initialError}
                domain={liveDomain}
                truncated={liveTruncated}
                isLoading={isLoading}
                filters={filters}
                query={query}
                setQuery={setQuery}
                visibleCount={visibleCount}
                setVisibleCount={setVisibleCount}
                onClearFilters={handleClearFilters}
                onToggleAvailability={handleAvailabilityToggle}
                onStoreLoaded={handleStreamedStoreLoaded}
              />
            </Suspense>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

type StreamedProductsProps = {
  /** Null when the client hook already has data and streaming is moot. */
  store: Promise<StoreReadResult> | null
  products: ShopifyProduct[] | null
  initialError: string | null
  domain: string | null
  truncated: boolean
  isLoading: boolean
  filters: React.ComponentProps<typeof FilterSidebar>["filters"]
  query: string
  setQuery: React.Dispatch<React.SetStateAction<string>>
  visibleCount: number
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>
  onClearFilters: () => void
  onToggleAvailability: () => void
  /**
   * Called once the streamed read confirms a store loaded. Carries the products
   * as well as the domain: the sidebar cannot await the promise itself, so this
   * is how the facets get built.
   */
  onStoreLoaded: (domain: string, products: ShopifyProduct[]) => void
}

/**
 * Awaits the streamed read, then owns the result set. Split out of
 * `CatalogViewer` purely so `use()` is called in a leaf: the boundary is above
 * this component, so everything the page is made of is already sent.
 */
const StreamedProducts = ({
  store,
  products,
  initialError,
  domain,
  truncated,
  isLoading,
  filters,
  query,
  setQuery,
  visibleCount,
  setVisibleCount,
  onClearFilters,
  onToggleAvailability,
  onStoreLoaded,
}: StreamedProductsProps) => {
  const read = store ? use(store) : null

  const resolvedProducts = products ?? (read?.ok ? read.products : [])
  const resolvedError =
    products === null && read && !read.ok ? read.error : initialError
  const resolvedTruncated =
    products === null && read?.ok ? read.truncated : truncated
  const resolvedDomain = domain ?? (read?.ok ? read.domain : null)

  /*
    Report a store that arrived from the home page, once, after it loads.

    The ref guards re-firing: this re-renders on every filter change, and
    `addSite` dedupes anyway, but a callback that appeared to do nothing on
    repeat renders would be a trap for whoever reads it next. Guarded on
    `products` being null so it only applies to the streamed read, never to a
    store the user switched to by hand.
  */
  const reportedRef = React.useRef(false)

  React.useEffect(() => {
    if (reportedRef.current) return
    if (products !== null) return
    if (!read?.ok) return

    reportedRef.current = true
    onStoreLoaded(read.domain, read.products)
  }, [onStoreLoaded, products, read])

  const visibleProducts = React.useMemo<ShopifyProduct[]>(() => {
    const searched = searchProducts(resolvedProducts, query)
    const filtered = applyFilters(searched, filters)

    return filtered
  }, [resolvedProducts, query, filters])

  const visible = visibleProducts.slice(0, visibleCount)
  const hasMore = visibleProducts.length > visibleCount

  const hasProducts = resolvedProducts.length > 0
  const showResults = !isLoading && hasProducts && visibleProducts.length > 0
  const showNoMatches =
    !isLoading && hasProducts && visibleProducts.length === 0

  return (
    <>
      {resolvedError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Could not load this store</AlertTitle>
          <AlertDescription className="text-pretty">
            {resolvedError}
          </AlertDescription>
        </Alert>
      )}

      {resolvedTruncated && (
        <Alert className="mb-6">
          <AlertTitle>Showing a partial catalog</AlertTitle>
          <AlertDescription className="text-pretty">
            This store publishes more products than one load can reach. The
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
              {resolvedDomain && (
                <span className="font-normal text-muted-foreground">
                  {" "}
                  from {resolvedDomain}
                </span>
              )}
            </h2>

            {resolvedProducts.length !== visibleProducts.length && (
              <p className="text-sm tabular-nums text-muted-foreground">
                {resolvedProducts.length.toLocaleString()} loaded
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
          <ProductList products={visible} domain={resolvedDomain ?? ""} />

          {hasMore && (
            <div className="mt-8 flex flex-col items-center gap-3">
              <p className="text-sm tabular-nums text-muted-foreground">
                Showing {visible.length.toLocaleString()} of{" "}
                {visibleProducts.length.toLocaleString()}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
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
              {resolvedProducts.length.toLocaleString()}{" "}
              {resolvedProducts.length === 1 ? "product" : "products"} loaded,
              none matching the current filters.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {/*
              When the in-stock filter is the only thing active, clearing
              everything is a blunt instrument. Offer the specific undo first,
              since it is the one the user just did.
            */}
            {filters.inStockOnly ? (
              <Button
                type="button"
                variant="outline"
                onClick={onToggleAvailability}
              >
                Show sold out products
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={onClearFilters}>
                Clear filters and search
              </Button>
            )}
          </EmptyContent>
        </Empty>
      )}

      {!hasProducts && !isLoading && !resolvedError && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No store loaded</EmptyTitle>
            <EmptyDescription>
              Enter a Shopify storefront above to pull its full product catalog.
              Catalog data is not persistently stored by Backroom.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </>
  )
}
