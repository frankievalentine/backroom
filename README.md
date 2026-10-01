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
removed entirely.

**`src/components/ui/**` is vendored registry output. Never hand-edit it.**
Those files are owned by shadcn and are replaced wholesale on the next
`shadcn add`, so a local edit is at best noise and at worst a silent
regression. Anything you need on top of a primitive goes in its own file under
`src/components/`, composed from the installed primitives. That is also the
pattern the shadcn docs use -- the sidebar docs, for example, show
`components/app-sidebar.tsx` as a file you write that imports from
`@/components/ui/sidebar`.

The installed files differ from the raw registry payload in three ways, all
applied by the CLI:

| Registry ships | Installed as | Why |
| --- | --- | --- |
| `@/registry/base-nova/ui/button` | `@/components/ui/button` | Alias rewriting to the project |
| `<IconPlaceholder lucide="ChevronLeftIcon" />` | `<ChevronLeftIcon />` | Resolves `iconLibrary: "lucide"` |
| `import * as React` | `import type * as React` | Type-only import transform |

So a local edit showing up as a diff against the registry JSON is expected; a
local edit showing up as a diff against the *installed* file is not.

Add or update components with:

```bash
pnpm dlx shadcn@latest add <component>
```

If a component needs behaviour the primitive cannot express, control it from a
wrapper instead of patching the primitive. `FilterSidebar` does this for the
sidebar's open state, because the registry's `SidebarProvider` writes a
`sidebar_state` cookie but never reads it back.

### Why `embla-carousel-react` is a dependency

The home page's featured carousel is the only reason this package exists. It is
not a choice made in application code: the registry item for `carousel` declares
it, so `shadcn add carousel` installed it.

```
https://ui.shadcn.com/r/styles/base-nova/carousel.json
→ "dependencies": ["cn", "embla-carousel-react"]
```

Removing it means removing `ui/carousel.tsx`, which in turn means hand-rolling
the carousel. That was weighed against native CSS scroll-snap
(`snap-x snap-mandatory` plus `scrollBy` for the buttons, roughly 25 lines) and
the decision was to keep Embla: the snap behaviour is maintained rather than
ours, and the featured section is not the part of this codebase most likely to
need changing.

Native scroll-snap is the cheaper option on bundle size and is a reasonable
call to revisit if the carousel grows more complex or Embla becomes a problem.

### Third-party registry components

`@aceternity/glowing-effect`, used on the featured cards, came from a community
registry. Note that its registry item **does not declare its `motion/react`
dependency** — `shadcn add` reported success and wrote the file, but
`pnpm build` then failed on the unresolved import until `motion` was installed
by hand. Check `package.json` after adding anything from a third-party namespace
rather than trusting the install output.

Two things the component does not handle, applied at the call site in
`FeaturedCard`:

- `disabled` defaults to `true` and renders nothing, so it must be passed
  `disabled={false}` (or a reduced-motion signal) explicitly.
- It attaches a document-level `pointermove` listener and animates a conic
  gradient every frame, so it is switched off entirely under
  `prefers-reduced-motion` rather than slowed down.

`variant="white"` is used instead of the default four-hue rainbow, because this
interface runs on a single neutral ramp plus one green accent.

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