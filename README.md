# product-scraper

Paste a Shopify storefront URL and browse its full product catalogue. Filter by
vendor, product type, tag and price.

## Getting started

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | Biome check (lint + format + import order) |
| `pnpm lint:fix` | Apply Biome's safe fixes |
| `pnpm format` | Biome formatter only |
| `pnpm verify` | typecheck, then lint, then build |

## Linting: Biome, not ESLint

This project uses [Biome](https://biomejs.dev) instead of ESLint. The previous
`eslint` + `eslint-config-next` setup could not run at all: `typescript-eslint`
does not support TypeScript 7, so `pnpm lint` failed on startup rather than
reporting anything. Biome parses the TypeScript directly and has no such
version coupling.

Configuration lives in `biome.json`. Two deliberate exclusions:

- **`src/components/ui/**` is not linted or formatted.** Those files are owned by
  the shadcn registry and are overwritten wholesale by `npx shadcn add`. Editing
  or reformatting them locally just creates diff noise on the next update.
- **`src/app/globals.css` is not linted.** Its Tailwind v4 at-rules
  (`@theme`, `@utility`, `@apply`, `@custom-variant`) are not valid to Biome's CSS
  parser.

`performance/noImgElement` is disabled project-wide. Product images come from
arbitrary user-supplied Shopify domains, and `next/image` requires those hosts to
be declared in `remotePatterns` up front. There is no allowlist that covers an
open-ended set of storefronts, so a plain `<img>` with `loading="lazy"` is the
correct tool here.

## Architecture

### Routes

| Route | Description |
| --- | --- |
| `/` | Home page: ranked popular stores plus featured and sponsored placements |
| `/scraper` | The tool. Accepts `?domain=<host>` and loads it on arrival |
| `POST /api/scrape` | Fetches and normalises a store's catalogue |

### Data flow

`POST /api/scrape` validates and normalises the domain, detects the platform,
walks the paginated `products.json` endpoint, and normalises each product into a
single predictable shape. The client stores the **canonical domain the server
returns**, never the raw user input, so `https://www.Store.com/` and
`store.com` can never become two separate saved entries.

Notable behaviours:

- **SSRF guard.** Requests to loopback, link-local, RFC1918 and cloud-metadata
  addresses are refused in `src/lib/domain.ts`.
- **Honest pagination.** The fetcher is capped and reports `truncated` when it
  stopped early, so the UI can tell the user the count is a lower bound rather
  than presenting a partial catalogue as complete.
- **No swallowing errors.** A failed page mid-walk is surfaced, not discarded.

### Component library

shadcn/ui on **Base UI** (`style: "base-nova"` in `components.json`). Radix was
removed entirely. Add or update components with:

```bash
pnpm dlx shadcn@latest add <component>
```

### Configuration files

Two files drive the home page, and both are meant to be edited directly:

- `src/lib/popular-sites.ts` — the ranked store list. Domains were verified to
  serve a parseable `products.json` belonging to that brand, and catalogue sizes
  were measured. See the note at the top of the file: several famous storefronts
  fail that check, so re-verify before adding one.
- `src/lib/featured.ts` — featured and sponsored placements, with expiry dates.

Sponsored entries only render a "Sponsored" badge once `status` is `"live"`.
Seed entries ship as `"placeholder"` and render as "Sample placement", so
nothing implies a paid relationship that does not exist.

## Deploying

The in-process cache in `src/app/api/scrape/route.ts` is per-instance and
best-effort. It stops a single user hammering the same store within a session
and nothing more. Replace it with a shared cache before relying on it across
multiple instances.