# Backroom

*A storefront explorer.* Paste a Shopify store URL and browse everything it
sells. Filter by brand, product type, tag, and price.

Live at [trybackroom.vercel.app](https://trybackroom.vercel.app).

## Try it

No account, no API key, no install.

1. Open the [explorer](https://trybackroom.vercel.app/backroom).
2. Paste a store URL. `allbirds.com` and `https://www.allbirds.com/` both work.
3. Filter the catalog in the sidebar.

Stores you load are saved in your browser, so they come back on your next visit.
That list stays on your device.

## Run it yourself

You'll need [Node](https://nodejs.org) 20 or newer and
[pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000.

## How it works

Most Shopify stores publish their entire product list at a public URL, usually
`https://yourstore.com/products.json`. No login, no API key. Backroom reads that
and shows you the result.

Three things make it more useful than opening the JSON yourself.

**You get the whole catalog.** Shopify serves that list a page at a time, 250
products each. Backroom keeps requesting pages until one comes back short, which
is how it knows it has reached the end. A store with 5,000 products gives you all
5,000. There's a ceiling, and when a store reaches it the page says so instead of
quietly showing you a partial list.

**The messy metadata gets cleaned up.** Stores fill these fields in wildly
different ways. Gymshark puts an entire category path in the product type field
(`Womens>Apparel>Leggings>full_length`) and its marketing tagline in the brand
field (`Gymshark | Be a visionary.`). Taken literally, that makes every product
its own filter option and repeats the tagline on every card. Backroom turns those
into "Full Length" and "Gymshark".

**You don't wait on a blank screen.** The page layout and filters appear
immediately, then products stream in underneath. A large store takes a few
seconds to fetch, and you can use the interface the whole time.

## What it doesn't do

Only Shopify stores, for now. WooCommerce, BigCommerce, Magento, and custom
storefronts aren't supported, and Backroom says so rather than showing you an
empty list. Some large retailers block automated requests entirely. Backroom
can't work around that and doesn't try.

No export, and no accounts. The FAQ on the home page covers the rest, including
whether scraping a particular store is something you should do.

## Deploying

Deployed to Vercel. `pnpm build` produces a standard Next.js build with no
platform-specific output, so it runs on any Node host.

Changing the code? [AGENTS.md](AGENTS.md) has the project's conventions: commit
style, linting, and which files are generated and shouldn't be hand-edited.
