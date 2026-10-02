import type { Metadata } from "next"
import { LegalPage } from "@/components/LegalPage"
import { LEGAL_CONTACT, PRIVACY_EFFECTIVE_DATE } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Backroom collects, what it does not, and how to reach us.",
}

/**
 * Privacy policy.
 *
 * Deliberately narrow because the application is narrow: no account system, no
 * visitor database, no analytics. The only visitor data that exists is whatever
 * the host records in order to serve HTTP, and saying so plainly is more useful
 * to a reader than boilerplate that technically covers it.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated={PRIVACY_EFFECTIVE_DATE}
      intro="Backroom has no accounts and no database of people. This page explains what is actually collected, which is very little."
    >
      <section>
        <h2>What we collect ourselves</h2>
        <p>
          Nothing that identifies you. We do not ask for an email address, do
          not operate accounts, and do not run analytics or advertising
          trackers.
        </p>
        <p>
          The list of stores you have opened is saved in your browser&rsquo;s
          local storage. It never reaches our servers, and we have no account
          system to associate it with.
        </p>
      </section>

      <section>
        <h2>What our host collects</h2>
        <p>
          The site is hosted on Vercel. Like any web host, Vercel processes
          ordinary request information in order to serve pages: your IP address,
          the URL requested, your browser&rsquo;s user agent, and timestamps. It
          may also derive approximate location from the IP address.
        </p>
        <p>
          This is infrastructure logging, not a product feature. We do not use
          it to build a profile of you, and it is handled under Vercel&rsquo;s
          own terms.
        </p>
      </section>

      <section>
        <h2>Catalog data</h2>
        <p>
          Product data is read from a store&rsquo;s public endpoint when you ask
          for it, held in memory for the length of the page view, and is not
          persistently stored by Backroom. A short-lived in-process cache may
          serve a repeat request for the same store within a single session.
        </p>
        <p>
          Product images are loaded by your browser directly from the
          merchant&rsquo;s own content delivery network. No copy of any image is
          stored on our infrastructure.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          Backroom sets no cookies of its own. A small amount of browser storage
          is used for your saved store list and sidebar state, both of which
          stay on your device.
        </p>
      </section>

      <section>
        <h2>What we do not do</h2>
        <ul>
          <li>No selling or sharing of personal information.</li>
          <li>No advertising or cross-site tracking.</li>
          <li>No third-party analytics scripts.</li>
        </ul>
      </section>

      <section>
        <h2>Retention</h2>
        <p>
          Product data lives in memory for the duration of a page view. Your
          saved store list stays on your device until you clear it, and clearing
          your browser storage removes it.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You can clear everything Backroom keeps on your device by clearing
          site data in your browser. Because we hold no account and no visitor
          database, there is nothing else for us to delete on request. If you
          believe we do hold information about you, contact us and we will
          investigate.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          If this policy changes, the date at the top of this page will change
          with it.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about this policy can go to{" "}
          <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>.
        </p>
      </section>
    </LegalPage>
  )
}
