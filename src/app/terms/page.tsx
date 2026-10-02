import type { Metadata } from "next"

import { LegalPage } from "@/components/LegalPage"
import {
  AFFILIATION_DISCLAIMER,
  LEGAL_CONTACT,
  TERMS_EFFECTIVE_DATE,
} from "@/lib/legal"

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
 * 1. The accuracy disclaimer, because the catalog genuinely can be partial and
 *    the UI says so. A warranty of completeness would contradict the product.
 * 2. The IP and no-endorsement clause, which is the reason the footer exists.
 * 3. The merchant removal clause, which describes the blocklist in opt-out.ts.
 *    A policy promising takedowns that the code cannot perform is worse than
 *    making no promise.
 */
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      updated={TERMS_EFFECTIVE_DATE}
      intro="These terms cover your use of Backroom. Using the site means accepting them."
    >
      <section>
        <h2>What Backroom is</h2>
        <p>{AFFILIATION_DISCLAIMER}</p>
        <p>
          Backroom is an independent tool for viewing publicly available Shopify
          storefront catalogs. Brand names appear only to identify whose store
          you are looking at. Nothing on this site should be read as a claim of
          partnership, authorisation, or approval by any brand mentioned.
        </p>
      </section>

      <section>
        <h2>Information comes from merchants</h2>
        <p>
          Product names, prices, availability, images, and descriptions are
          supplied by third-party merchants and can change at any moment.
          Backroom does not control them and does not warrant that what you see
          is complete, current, or accurate.
        </p>
        <p>
          Confirm anything that matters &mdash; price, size, availability,
          shipping &mdash; with the merchant before buying. A catalog can also
          be partial: some stores are larger than the number of products
          Backroom will fetch, and the interface says so when that happens.
        </p>
      </section>

      <section>
        <h2>Intellectual property</h2>
        <p>
          All trademarks, product names, photographs, descriptions, and other
          materials remain the property of their respective owners. Their
          appearance through Backroom does not imply sponsorship, affiliation,
          or endorsement.
        </p>
        <p>
          Backroom does not copy product images or marketing copy. Images are
          loaded directly from each merchant&rsquo;s own servers by your
          browser, and Backroom does not display the written product
          descriptions that stores publish.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>
          Do not use Backroom to build a commercial catalog, price-comparison
          service, or dataset for redistribution. Do not automate requests at a
          rate that burdens a merchant&rsquo;s servers, and do not attempt to
          access any store that has blocked automated access.
        </p>
        <p>
          Backroom requests only endpoints a storefront publishes publicly. It
          does not bypass authentication, CAPTCHAs, rate limits, or any other
          access control, and it does not attempt to work around a store
          refusing a request.
        </p>
      </section>

      <section>
        <h2>Merchant and rights-holder requests</h2>
        <p>
          If you operate a storefront displayed through Backroom and want your
          domain removed, or you believe material shown here infringes your
          rights, contact{" "}
          <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a> with the
          domain. We add requested domains to a blocklist without argument and
          the change takes effect on the next deploy.
        </p>
        <p>
          We will remove disputed material on request and investigate
          afterwards.
        </p>
      </section>

      <section>
        <h2>No warranty</h2>
        <p>
          Backroom is provided as is, without warranty of any kind, express or
          implied, including fitness for a particular purpose. It may be
          unavailable, inaccurate, or incomplete at any time.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, the operator of Backroom is
          not liable for any loss arising from your use of the site, including
          any reliance on catalog information that turns out to be wrong, out of
          date, or unavailable at the merchant.
        </p>
      </section>

      <section>
        <h2>Changes and termination</h2>
        <p>
          These terms may change, and the date at the top of this page will
          change with them. We may block any domain from the service, limit
          access, or discontinue the service at our discretion.
        </p>
      </section>
    </LegalPage>
  )
}
