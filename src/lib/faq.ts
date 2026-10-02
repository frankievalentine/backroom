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
      "Any storefront running on Shopify. We detect the platform automatically and read its public products.json endpoint, which most Shopify themes expose. WooCommerce, BigCommerce, Magento and custom storefronts are not supported yet, and we would rather say so than return an empty list.",
  },
  {
    id: "is-it-legal",
    question: "Is scraping a store legal?",
    answer:
      "That depends on the store, its terms and your jurisdiction, and it is your call to make. This tool only requests the same public endpoint a browser would, at the request rate a person browsing would. It does not bypass authentication, paywalls or any access control. Check a store's terms before relying on this commercially.",
  },
  {
    id: "stored-anywhere",
    question: "Is my browsing history stored?",
    answer:
      "Saved stores live in your browser's local storage. They never leave your device, and we have no account system to attach them to. Product data is held in memory for the length of the page view and discarded when you close the tab.",
  },
  {
    id: "large-stores",
    question: "What happens with a store that has thousands of products?",
    answer:
      "We walk the paginated catalog rather than stopping at the first page. If a store is large enough to hit our 5,000-product ceiling we say so on screen and mark the count as a lower bound, rather than quietly showing you a partial catalog that looks complete.",
  },
  {
    id: "blocked-stores",
    question: "Some store says it is not Shopify. Why?",
    answer:
      "Usually because the store is not on Shopify, or because its firewall blocks server-side requests. A handful of large retailers reject automated traffic outright. We cannot work around that, and we would rather show the failure than mask it.",
  },
  {
    id: "export-data",
    question: "Can I export the data?",
    answer:
      "Not yet. The catalog is filtered and searched in the browser, and there is no export endpoint today. Everything you see is derived from the public products.json payload, so any store you can load here you can also pull with a direct request.",
  },
]
