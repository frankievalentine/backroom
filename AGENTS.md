# Working in this repo

Notes for agents and contributors. Nothing here is needed to run the app — see
[README.md](README.md) for that.

## Committing

[Conventional Commits](https://www.conventionalcommits.org):
`<type>(<scope>): <imperative summary>`, for example
`fix(a11y): restore checkbox and label association`.

`.gitmessage` holds the types, the scopes used here, and the house rules. Point
git at it once:

```bash
git config commit.template .gitmessage
```

The convention is advisory, not enforced — no hooks. Keep the subject under 72
characters, and spend the body on **why** rather than what the diff already
shows.

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

Run `verify` before committing. It is the whole gate.

## Linting: Biome, not ESLint

[Biome](https://biomejs.dev) replaces ESLint here. The previous
`eslint` + `eslint-config-next` setup could not run at all: `typescript-eslint`
does not support TypeScript 7, so `pnpm lint` failed on startup rather than
reporting anything. Biome parses the TypeScript directly and has no such version
coupling.

Configuration lives in `biome.json`. Three deliberate settings:

- **`src/components/ui/**` is not linted or formatted.** Owned by the shadcn
  registry, overwritten wholesale by `npx shadcn add`. Editing or reformatting
  them locally just creates diff noise on the next update.
- **`src/app/globals.css` is not linted.** Its Tailwind v4 at-rules
  (`@theme`, `@utility`, `@apply`, `@custom-variant`) are not valid to Biome's
  CSS parser.
- **`performance/noImgElement` is off.** Product images come from arbitrary
  user-supplied Shopify domains, and `next/image` requires those hosts declared
  in `remotePatterns` up front. There is no allowlist covering an open-ended set
  of storefronts, so a plain `<img>` with `loading="lazy"` is correct here.

## Component library

shadcn/ui on **Base UI** (`style: "base-nova"` in `components.json`). Radix was
removed entirely.

**`src/components/ui/**` is vendored registry output. Never hand-edit it.**
Those files are replaced wholesale on the next `shadcn add`, so a local edit is
at best noise and at worst a silent regression. Anything needed on top of a
primitive goes in its own file under `src/components/`, composed from the
installed primitives. That is also the pattern the shadcn docs use — the sidebar
docs, for example, show `components/app-sidebar.tsx` as a file you write that
imports from `@/components/ui/sidebar`.

```bash
pnpm dlx shadcn@latest add <component>
```

The installed files differ from the raw registry payload in three ways, all
applied by the CLI:

| Registry ships | Installed as | Why |
| --- | --- | --- |
| `@/registry/base-nova/ui/button` | `@/components/ui/button` | Alias rewriting to the project |
| `<IconPlaceholder lucide="ChevronLeftIcon" />` | `<ChevronLeftIcon />` | Resolves `iconLibrary: "lucide"` |
| `import * as React` | `import type * as React` | Type-only import transform |

So a local edit showing up as a diff against the registry JSON is expected; a
local edit showing up as a diff against the *installed* file is not.

If a component needs behaviour the primitive cannot express, control it from a
wrapper instead of patching the primitive. `FilterSidebar` does this for the
sidebar's open state, because the registry's `SidebarProvider` writes a
`sidebar_state` cookie but never reads it back.

### Third-party registry components

`@aceternity/glowing-effect`, used on the featured cards, came from a community
registry. Its registry item **does not declare its `motion/react` dependency** —
`shadcn add` reported success and wrote the file, but `pnpm build` then failed on
the unresolved import until `motion` was installed by hand. Check `package.json`
after adding anything from a third-party namespace rather than trusting the
install output.

Two things the component does not handle, applied at the call site in
`FeaturedCard`:

- `disabled` defaults to `true` and renders nothing, so it must be passed
  `disabled={false}` (or a reduced-motion signal) explicitly.
- It attaches a document-level `pointermove` listener and animates a conic
  gradient every frame, so it is switched off entirely under
  `prefers-reduced-motion` rather than slowed down.

It uses the component's default four-hue gradient. `variant="white"` gives a
monochrome version of the same effect if the colour needs toning down.

### Why `embla-carousel-react` is a dependency

The home page's featured carousel is the only reason this package exists. It is
not a choice made in application code: the registry item for `carousel` declares
it, so `shadcn add carousel` installed it.

```
https://ui.shadcn.com/r/styles/base-nova/carousel.json
→ "dependencies": ["cn", "embla-carousel-react"]
```

Removing it means removing `ui/carousel.tsx`, which means hand-rolling the
carousel. That was weighed against native CSS scroll-snap (`snap-x snap-mandatory`
plus `scrollBy` for the buttons, roughly 25 lines) and the decision was to keep
Embla: the snap behaviour is maintained rather than ours, and the featured
section is not the part of this codebase most likely to need changing.

Native scroll-snap is cheaper on bundle size and worth revisiting if the carousel
grows more complex or Embla becomes a problem.

## Configuration files

Two files drive the home page, and both are meant to be edited directly:

- `src/lib/popular-sites.ts` — the ranked store list. Domains were verified to
  serve a parseable `products.json` belonging to that brand, and catalog sizes
  were measured. See the note at the top of the file: several famous storefronts
  fail that check, so re-verify before adding one.
- `src/lib/featured.ts` — featured and sponsored placements, with expiry dates.

Sponsored entries only render a "Sponsored" badge once `status` is `"live"`. Seed
entries ship as `"placeholder"` and render as "Sample placement", so nothing
implies a paid relationship that does not exist.

## Security

`src/lib/domain.ts` refuses loopback, link-local, RFC1918 and cloud-metadata
addresses, so a user-supplied domain cannot be used to reach internal services.

This guard is load-bearing, not defensive decoration. `/api/scrape` is public and
accepts any domain, so without it the route is an SSRF primitive. If you add a
code path that fetches a host, route it through `normalizeDomain` rather than
interpolating the input into a URL.

## Hosting notes

Deployed to Vercel. The build is a standard `next build` with no
platform-specific output directory, so it also runs on any Node host.

Two constraints to keep in mind if the host changes:

- **Cloudflare Workers requires Workers Paid, not Free.** The catalog walk makes
  up to 21 subrequests and the free plan caps CPU at 10ms per request, which SSR
  with a large payload exceeds. Paid has no daily request cap and raises CPU to 30s
  by default.
- **The in-process cache in `src/app/api/scrape/route.ts` is per-instance.** It
  stops one user hammering the same store within a session and nothing more. On
  serverless it resets per isolate, so the hit rate is far lower than the code
  suggests. Replace it with a shared cache before relying on it.
