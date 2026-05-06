import type { Metadata } from "next";
import { getSiteContentMarketing } from "@/lib/data/site-content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Pawfect collects, uses, and protects pet and account data — India DPDP-aware policy for our app and website.",
};

export default async function PrivacyPage(): Promise<React.ReactElement> {
  const site = await getSiteContentMarketing();

  return (
    <div className="py-24 md:py-32">
      <article className="prose prose-stone mx-auto max-w-3xl px-4 dark:prose-invert sm:px-6 lg:px-8">
        <p className="not-prose text-sm font-medium uppercase tracking-wide text-stone-500">Pawfect</p>
        <h1>Privacy Policy</h1>
        <p className="text-sm text-stone-500">
          Last updated: {site.privacyLastUpdated} &nbsp;|&nbsp; Effective: {site.privacyLastUpdated}
        </p>

        <aside className="not-prose my-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-stone-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-stone-200">
          <p className="m-0 text-sm font-semibold">Important — not a veterinary service</p>
          <p className="mt-2 mb-0 text-sm leading-relaxed">
            Pawfect is a scheduling and record-keeping tool for pet health reminders. It is not a veterinary service,
            medical device, or diagnostic tool. Vaccination and deworming schedules are based on general vet-validated
            protocols and your pet&apos;s date of birth and lifestyle inputs. They do not constitute professional
            veterinary advice, diagnosis, or treatment. Always consult a licensed veterinarian for your pet&apos;s
            health decisions.
          </p>
        </aside>

        <h2>1. Who we are</h2>
        <p>
          Pawfect (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates a mobile application that helps pet owners
          schedule and record pet health activities such as vaccinations, deworming, and vet visits. We are not a
          veterinary practice and do not employ licensed veterinarians.
        </p>
        <p>
          Contact:{" "}
          <a href="mailto:privacy@pawfect.app" className="text-stone-700 underline dark:text-stone-300">
            privacy@pawfect.app
          </a>
        </p>

        <h2>2. Scope</h2>
        <p>This Privacy Policy applies to:</p>
        <ul>
          <li>The Pawfect mobile application (Android / iOS)</li>
          <li>Our website at paw-fect.vercel.app</li>
          <li>Any related services or communications from Pawfect</li>
        </ul>

        <h2>3. Data we collect</h2>
        <h3>3.1 Account data</h3>
        <p>
          Email address or phone number collected when you create an account or sign in via a third-party provider.
        </p>
        <h3>3.2 Pet profile data</h3>
        <p>
          Pet name, species (dog or cat), date of birth, sex, weight, and lifestyle inputs (indoor / outdoor / mixed)
          that you voluntarily provide to generate schedules.
        </p>
        <h3>3.3 Health records</h3>
        <p>
          Vaccine dates and types, deworming dates and intervals, vet visit notes, attachments metadata (file name and
          size — not file contents unless you explicitly upload), and milestone records you choose to log.
        </p>
        <h3>3.4 Device, network &amp; diagnostics</h3>
        <p>
          Operating system version, app version, device model, language/locale, crash logs, and diagnostic events. We use
          these to keep the app reliable and secure. We do not collect your precise GPS location for core features.
        </p>
        <p>
          <strong>Device and telephony-related signals.</strong> Some platform and payment-related software development
          kits (SDKs) in the app may access device or telephony-related information (for example, device identifiers or
          network/connection state) to help prevent fraud, process payments securely, and meet regulatory or platform
          requirements. We do not use this category of information to sell data or to build advertising profiles. For
          details beyond what Pawfect controls directly, see the privacy notices of the payment and platform providers
          listed in Section 7.
        </p>
        <h3>3.5 Push notifications</h3>
        <p>
          If you enable reminders, we use push-notification services (including vendor SDKs) to deliver alerts to your
          device. You can turn off notifications in your device settings or in the app where available.
        </p>
        <h3>3.6 Analytics</h3>
        <p>
          Aggregate or de-identified usage data (for example, feature adoption and session patterns) to improve the
          product. We do not build individual advertising profiles from pet health data.
        </p>
        <h3>3.7 Payments &amp; purchases</h3>
        <p>
          When you subscribe or make in-app purchases, payment details are processed by payment providers (for example,
          Google Play Billing on Android, Apple on iOS, and Razorpay where we offer that flow). We receive limited
          transaction metadata (such as subscription status, purchase tokens, and receipts) needed to unlock features — not
          your full card number. Those providers process payments under their own terms and privacy policies.
        </p>

        <h2>4. Legal basis for processing (India — DPDP Act 2023)</h2>
        <p>We process your personal data on the following bases:</p>
        <ul>
          <li>
            <strong>Consent</strong> — you provide pet and health data voluntarily to use the scheduling features.
          </li>
          <li>
            <strong>Contract performance</strong> — processing your account data to deliver subscription services.
          </li>
          <li>
            <strong>Legitimate interests</strong> — crash analytics and security monitoring to maintain service
            reliability.
          </li>
        </ul>

        <h2>5. How we use your data</h2>
        <ul>
          <li>Generate pet-specific health schedules and in-app reminders.</li>
          <li>Sync and back up records across your devices when cloud features are enabled.</li>
          <li>Provide customer support and respond to inquiries.</li>
          <li>Improve app reliability, security, and user experience.</li>
          <li>Comply with legal obligations.</li>
        </ul>

        <h2>6. What we do not do</h2>
        <ul>
          <li>We do not sell personal data to third parties.</li>
          <li>We do not share pet health data with advertisers.</li>
          <li>We do not use your private health records to train third-party AI or ML models.</li>
          <li>We do not collect data to build advertising profiles.</li>
          <li>We do not provide veterinary diagnoses, treatment recommendations, or medical advice.</li>
        </ul>

        <h2>7. Data sharing &amp; processors</h2>
        <p>We share data only in the following limited circumstances:</p>
        <ul>
          <li>
            <strong>Infrastructure &amp; authentication</strong> — we use providers such as{" "}
            <strong>Google Firebase / Google Cloud</strong> (for example, authentication, database, and related backend
            services) and <strong>Google Sign-In</strong> where you choose that sign-in method. Google&apos;s handling of
            data is described in Google&apos;s privacy policy and product terms.
          </li>
          <li>
            <strong>Payments</strong> — <strong>Google Play Billing</strong> (Android), <strong>Apple</strong> (iOS), and{" "}
            <strong>Razorpay</strong> (where offered) process payments and may collect data needed for fraud prevention,
            reconciliation, and legal compliance.
          </li>
          <li>
            <strong>Notifications &amp; device features</strong> — vendors that power push notifications and related
            device integrations, operating only as needed to deliver those features.
          </li>
          <li>
            <strong>Other service providers</strong> — hosting, crash reporting, security monitoring, and product
            analytics, under agreements that limit use to providing services to us.
          </li>
          <li>
            <strong>Legal requirements</strong> — when required by Indian law, court order, or to protect rights and
            safety.
          </li>
          <li>
            <strong>Business transfer</strong> — in the event of a merger or acquisition, with notice to you where
            required.
          </li>
        </ul>
        <p>
          <strong>Google Play — Data safety.</strong> Google Play publishes a structured &quot;Data safety&quot;
          declaration for our Android app. That declaration summarizes categories of data collection and sharing as
          understood by us for the store; this Privacy Policy is the fuller explanation. If you notice an inconsistency,
          contact us and we will correct the store declaration or this policy as appropriate.
        </p>

        <h2>8. Health data — special handling</h2>
        <p>
          Pet health records (vaccine dates, deworming schedules, vet visit notes) are treated as sensitive personal
          data. They are:
        </p>
        <ul>
          <li>Encrypted in transit (TLS 1.2+) and at rest.</li>
          <li>Accessible only to your account.</li>
          <li>Not used for advertising targeting.</li>
          <li>Not shared with third-party health platforms or insurers without your explicit consent.</li>
        </ul>
        <p>
          Note: Pawfect schedules are informational reminders based on standard veterinary protocols and your pet&apos;s
          profile inputs. They are not diagnostic outputs. Always follow your veterinarian&apos;s specific guidance for
          your pet&apos;s individual health needs.
        </p>

        <h2>9. Data retention</h2>
        <p>
          We retain account and pet data for as long as your account is active. After account deletion, we aim to remove
          personal and pet health data within 30 days, except where a longer period is required by law or ongoing
          dispute resolution.
        </p>

        <h2>10. Your rights (DPDP Act, 2023)</h2>
        <p>
          As a Data Principal under India&apos;s Digital Personal Data Protection Act, 2023, you may have the right to:
        </p>
        <ul>
          <li>
            <strong>Access</strong> — request a summary of personal data we hold about you.
          </li>
          <li>
            <strong>Correction</strong> — request correction of inaccurate or incomplete data.
          </li>
          <li>
            <strong>Erasure</strong> — request deletion of your personal data (right to be forgotten).
          </li>
          <li>
            <strong>Grievance redressal</strong> — lodge a complaint with our Data Protection Officer.
          </li>
        </ul>
        <p>
          To exercise any right, email{" "}
          <a href="mailto:privacy@pawfect.app" className="text-stone-700 underline dark:text-stone-300">
            privacy@pawfect.app
          </a>{" "}
          with your registered account details. We may verify your identity before fulfilling requests. We will respond
          within 30 days.
        </p>

        <h2>11. Children</h2>
        <p>
          Pawfect is intended for adults (18+) managing pet care. We do not knowingly collect personal data from minors.
          If you believe a minor has submitted data, contact{" "}
          <a href="mailto:privacy@pawfect.app" className="text-stone-700 underline dark:text-stone-300">
            privacy@pawfect.app
          </a>{" "}
          for immediate deletion.
        </p>

        <h2>12. Cookies &amp; analytics</h2>
        <p>
          Our marketing website may use privacy-oriented analytics (e.g., aggregate page views). We do not use
          third-party advertising cookies for cross-site tracking on our properties.
        </p>

        <h2>13. Security</h2>
        <p>
          We implement industry-standard security measures including TLS encryption in transit, encryption at rest,
          access controls, and regular security reviews. However, no system is completely secure and we cannot guarantee
          absolute security.
        </p>

        <h2>14. Changes to this policy</h2>
        <p>
          We will update this page for material changes and revise the Last updated date. Where required, we will notify
          you via in-app notification or email.
        </p>

        <h2>15. Contact &amp; grievance officer</h2>
        <p>For privacy concerns or to exercise your rights:</p>
        <ul>
          <li>
            Email:{" "}
            <a href="mailto:privacy@pawfect.app" className="text-stone-700 underline dark:text-stone-300">
              privacy@pawfect.app
            </a>
          </li>
          <li>Response time: within 30 days</li>
        </ul>

        <p className="text-sm text-stone-500">© 2026 Pawfect. All rights reserved.</p>
      </article>
    </div>
  );
}
