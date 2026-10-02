import type { Metadata } from "next"

import { LegalPage } from "@/components/LegalPage"
import { TERMS_EFFECTIVE_DATE } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for using Backroom.",
}

/**
 * Terms of use.
 *
 * Three sections are load-bearing rather than boilerplate, and each is written to
 * match what the code actually does:
 *
 * 1. The accuracy section, because the catalog genuinely can be partial and the
 *    interface says so. A warranty of completeness would contradict the product.
 * 2. The intellectual property section, which records that Backroom neither
 *    copies product images nor displays stores' written descriptions. Both are
 *    true and neither is obvious to a reader.
 * 3. The removal section, which describes the blocklist that exists. A policy
 *    promising takedowns the code could not perform is worse than making no
 *    promise at all.
 *
 * Written in plain sentences on purpose. A legal page nobody can follow does not
 * protect anybody.
 */
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      updated={TERMS_EFFECTIVE_DATE}
      formKind="rights"
      intro="These terms cover your use of Backroom. Using the site means you accept them."
    >
      <section>
        <h2>What Backroom is</h2>
        <p>
          Backroom is an independent tool for viewing publicly available Shopify
          storefront catalogs. It is not affiliated with, endorsed by, or
          sponsored by Shopify or any merchant displayed here.
        </p>
        <p>
          Brand names appear only to identify whose store you are looking at.
          Nothing on this site should be read as a claim of partnership,
          authorisation, or approval by any brand mentioned.
        </p>
      </section>

      <section>
        <h2>Product information comes from merchants</h2>
        <p>
          Product names, prices, availability, images, and descriptions come
          from third-party merchants and can change at any moment. We do not
          control them and cannot promise they are complete, current, or
          accurate.
        </p>
        <p>
          Check anything that matters &mdash; price, size, availability,
          shipping &mdash; with the merchant before you buy. A catalog can also
          be partial: some stores are larger than the number of products
          Backroom will fetch, and the page says so when that happens.
        </p>
      </section>

      <section>
        <h2>Intellectual property</h2>
        <p>
          All trademarks, product names, photographs, descriptions, and other
          materials belong to their respective owners. Seeing them here does not
          imply sponsorship, affiliation, or endorsement.
        </p>
        <p>
          Backroom does not copy product images or marketing copy. Images load
          directly from each merchant&rsquo;s own servers into your browser, and
          we do not display the written product descriptions that stores
          publish.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>
          Do not use Backroom to build a commercial catalog, a price-comparison
          service, or a dataset for redistribution. Do not automate requests at
          a rate that burdens a merchant&rsquo;s servers.
        </p>
        <p>
          Backroom requests only endpoints a storefront publishes for anyone to
          read. It does not bypass authentication, CAPTCHAs, rate limits, or any
          other access control, and it does not try to work around a store
          refusing a request.
        </p>
      </section>

      <section>
        <h2>Removing a store</h2>
        <p>
          If you run a storefront and want your domain removed, use the form at
          the bottom of this page. We add requested domains to a blocklist
          without argument, and the change goes live on our next deploy.
        </p>
        <p>
          If you believe material shown here infringes your rights, use the same
          form. We remove disputed material first and investigate afterwards.
        </p>
      </section>

      <section>
        <h2>No warranty</h2>
        <p>
          Backroom is provided as is, without warranty of any kind, express or
          implied. It may be unavailable, inaccurate, or incomplete at any time.
        </p>
      </section>

      <section>
        <h2>Limit of liability</h2>
        <p>
          To the fullest extent the law allows, the operator of Backroom is not
          liable for loss arising from your use of the site. That includes
          relying on catalog information that turns out to be wrong, out of
          date, or unavailable at the merchant.
        </p>
      </section>

      <section>
        <h2>Changes and stopping the service</h2>
        <p>
          These terms may change, and the date at the top of this page changes
          with them. We may block any domain from the service, limit access, or
          shut the service down.
        </p>
      </section>
    </LegalPage>
  )
}
