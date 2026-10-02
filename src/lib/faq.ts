/**
 * FAQ entries for the home page.
 *
 * These answer questions a visitor actually has about *this* tool. Nothing here
 * is filler: if an answer stops being true, the code that makes it false should
 * change too, not just this file.
 */

export type FaqEntry = {
  id: string
  question: string
  answer: string
}

export const FAQ_ENTRIES: readonly FaqEntry[] = [
  {
    id: "which-stores",
    question: "Which stores can I explore?",
    answer:
      "Most storefronts running on Shopify. We detect the platform automatically and read its public products.json endpoint, which the large majority of stores expose without a key or a login. WooCommerce, BigCommerce, Magento and custom storefronts are not supported, and we would rather say so than return an empty list.",
  },
  {
    id: "blocked-stores",
    question: "What if a store won't load?",
    answer:
      "Usually because the store blocks automated requests, not because it is unsupported. Some Shopify stores sit behind bot protection, some have the catalog endpoint switched off, and some run a custom or headless storefront with no public catalog to read. A store can also simply be on WooCommerce or Magento, which we do not support. When a store won't load we say so and stop there — we do not try to get around a store that has declined the request.",
  },
  {
    id: "is-it-legal",
    question: "Is scraping a store legal?",
    answer:
      "That depends on the store, its terms and your jurisdiction, and it is your call to make. Backroom only requests the same public endpoint a browser would load, at the rate a person browsing would. It never bypasses authentication, CAPTCHAs, rate limits or any other access control, and if a store blocks automated requests we report that rather than working around it. Check a store's terms before relying on this commercially.",
  },
  {
    id: "what-we-access",
    question: "What exactly does Backroom read from a store?",
    answer:
      "Only the public product catalog that a storefront publishes for anyone to read, at its own /products.json address. Backroom does not access merchant admin areas, customer records, orders, private APIs, or any authenticated data. Product images are loaded by your browser straight from the merchant's own CDN, so no copy of them is kept on our infrastructure.",
  },
  {
    id: "brand-ownership",
    question: "Who owns the brands and product information?",
    answer:
      "The merchants, not us. Brand names appear only to identify whose store you are looking at. Backroom is an independent tool and is not affiliated with, endorsed by, or sponsored by Shopify or any merchant shown here.",
  },
  {
    id: "opt-out",
    question: "I run a store. How do I get removed?",
    answer:
      "Use the contact form and we will add your domain to a blocklist. It is a short list and we honour requests without argument, so you do not need to explain the legal position. The change goes live on the next deploy.",
  },
  {
    id: "feature-your-store",
    question: "Can I feature my store on Backroom?",
    answer:
      "Yes. The home page has a sponsored section, and every store in it is a paid placement. We do not mix in free editorial picks, so a Sponsored badge means exactly what it says. A placement is a card and a link: it does not change how your store is filtered, ranked, or counted, and it does not affect whether your store loads. Use the contact form and we will send you details.",
  },
  {
    id: "stored-anywhere",
    question: "Is my browsing history stored?",
    answer:
      "Saved stores live in your browser's local storage. They never leave your device, and we have no account system to attach them to. Product data is held in memory for the length of the page view and is not persistently stored by Backroom. Our host does process ordinary request information such as IP addresses and user agents as part of serving the site, which is covered in the privacy policy.",
  },
  {
    id: "large-stores",
    question: "What happens with a store that has thousands of products?",
    answer:
      "We walk the paginated catalog rather than stopping at the first page. If a store is large enough to hit our 5,000-product ceiling we say so on screen and mark the count as a lower bound, rather than quietly showing you a partial catalog that looks complete.",
  },
  {
    id: "export-data",
    question: "Can I export the data?",
    answer:
      "Not yet. The catalog is filtered and searched in the browser, and there is no export endpoint today. Everything you see is derived from the public products.json payload, so any store you can load here you can also pull with a direct request.",
  },
]
