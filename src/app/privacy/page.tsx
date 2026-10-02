import type { Metadata } from "next"

import { LegalPage } from "@/components/LegalPage"
import { PRIVACY_EFFECTIVE_DATE } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Backroom collects, what it does not, and how to reach us.",
}

/**
 * Privacy policy.
 *
 * Kept short because the application is short. There is no account system, no
 * visitor database, and no analytics, so the honest disclosure is that our host
 * records ordinary request data and nothing else happens. Boilerplate that
 * technically covers that would be longer and less true.
 *
 * The sections follow the questions a reader actually has, in the order they
 * would ask them: what do you collect, what happens to the catalog, what about
 * cookies, what don't you do, how do I get rid of it.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated={PRIVACY_EFFECTIVE_DATE}
      formKind="privacy"
      intro="Backroom has no accounts and keeps no database of people. This page covers what is actually collected, which is very little."
    >
      <section>
        <h2>What we collect</h2>
        <p>
          Nothing that identifies you. We do not ask for an email address and do
          not run analytics or advertising trackers.
        </p>
      </section>

      <section>
        <h2>What our host collects</h2>
        <p>
          The site runs on Vercel. Like any web host, Vercel records what is
          needed to serve pages: your IP address, the page you requested, your
          browser&rsquo;s user agent, and a timestamp. It may also work out your
          approximate location from your IP address.
        </p>
        <p>
          That is infrastructure logging, not something we use to build a
          profile of you. It is handled under Vercel&rsquo;s own terms.
        </p>
      </section>

      <section>
        <h2>Your saved stores</h2>
        <p>
          The list of stores you have opened is saved in your browser&rsquo;s
          local storage. It never reaches our servers, and we have no account
          system to attach it to.
        </p>
      </section>

      <section>
        <h2>Catalog data</h2>
        <p>
          Product data is read from a store&rsquo;s public endpoint when you ask
          for it and held in memory for that page view. We do not keep a copy. A
          short-lived cache may serve a repeat request for the same store within
          one session.
        </p>
        <p>
          Product images load straight from the merchant&rsquo;s own servers,
          into your browser. No copy of any image is stored on our
          infrastructure.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          Backroom sets no cookies. It uses a small amount of browser storage
          for your saved stores and sidebar state, and both stay on your device.
        </p>
      </section>

      <section>
        <h2>What we do not do</h2>
        <ul>
          <li>We do not sell or share personal information.</li>
          <li>We do not run advertising or cross-site trackers.</li>
          <li>We do not load third-party analytics.</li>
        </ul>
      </section>

      <section>
        <h2>How to remove what is on your device</h2>
        <p>
          Clear site data in your browser and the saved store list and sidebar
          state are gone. Because we hold no account and no visitor database,
          there is nothing else for us to delete on request. If you think we do
          hold information about you, use the form below and we will look into
          it.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          If this policy changes, the date at the top of this page changes with
          it.
        </p>
      </section>
    </LegalPage>
  )
}
