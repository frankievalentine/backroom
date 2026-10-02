import type { Metadata } from "next"

import { LegalPage } from "@/components/LegalPage"
import { TERMS_EFFECTIVE_DATE } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms for using Backroom.",
}

/**
 * Terms of use.
 *
 * Three sections are load-bearing rather than boilerplate, each written to match
 * what the code does: accuracy, because the catalog genuinely can be partial; the
 * intellectual property section, which records that no product images are copied
 * and no store copy is displayed, both true and neither obvious to a reader; and
 * removal, which describes the blocklist that exists rather than promising
 * takedowns the code could not perform.
 *
 * Plain sentences on purpose. A legal page nobody can follow does not protect
 * anybody.
 */
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      updated={TERMS_EFFECTIVE_DATE}
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
          If you run a storefront and want your domain removed, use the contact
          form. We add requested domains to a blocklist without argument, and
          the change goes live on our next deploy.
        </p>
        <p>
          If you believe material shown here infringes your rights, use the same
          form. We remove disputed material first and investigate afterwards.
        </p>
      </section>

      <section>
        <h2>Sponsored placements</h2>
        <p>
          The sponsored section on the home page contains paid placements only.
          There are no free editorial picks mixed in, and every store shown
          there carries a visible Sponsored label.
        </p>
        <p>
          A placement is a card and a link. It does not change how a store is
          filtered, ranked, or counted anywhere in the tool, and it does not
          affect whether a store loads.
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
