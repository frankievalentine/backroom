# Backroom

*A storefront explorer.* Paste a Shopify storefront URL and browse its full
product catalog. Filter by vendor, product type, tag and price.

## Running it

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000.

## Routes

| Route | What it does |
| --- | --- |
| `/` | Ranked popular stores, plus featured and sponsored placements |
| `/backroom` | The tool. Takes `?domain=<host>` and loads it on arrival |
| `/scraper` | Permanent redirect to `/backroom`, query string carried across |
| `POST /api/scrape` | Fetches and normalises a store's catalog |

## How it works

A store is read once, on the server. `readStore` normalises the domain, detects
the platform, walks the paginated `products.json` endpoint, and normalises every
product into one predictable shape. The client keeps the **canonical domain the
server returns**, never the raw input, so `https://www.Store.com/` and
`store.com` cannot become two separate saved entries.

Three decisions worth knowing about:

- **Stores publish bad metadata.** Some send a delimited taxonomy path in
  `product_type` (`Womens>Apparel>Leggings>full_length`) and a marketing tagline
  in `vendor` (`Gymshark | Be a visionary.`). Both are normalised at the facet
  boundary, and the same helper is used to build the options and to match them,
  so a checkbox can never list a value that filters nothing.
- **Pagination is honest.** The walk is capped and reports `truncated` when it
  stopped early, so the UI can tell you the count is a lower bound instead of
  presenting a partial catalog as complete.
- **The page streams.** The catalog read is started but not awaited, then resolved
  behind a Suspense boundary. The sidebar, toolbar and heading paint immediately;
  only the product grid waits. Awaiting it in the page component would put the
  whole route behind a skeleton.

## Deploying

Deployed to Vercel at [trybackroom.vercel.app](https://trybackroom.vercel.app).
`pnpm build` produces a standard Next.js build with no platform-specific output
directory, so the same build runs on any Node host.
