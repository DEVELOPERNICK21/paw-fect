import type { Metadata } from "next";
import { getSiteContentMarketing } from "@/lib/data/site-content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Pawfect collects, uses, and protects pet and account data — India DPDP-aware summary.",
};

export default async function PrivacyPage(): Promise<React.ReactElement> {
  const site = await getSiteContentMarketing();

  return (
    <div className="py-24 md:py-32">
      <article className="prose prose-stone mx-auto max-w-3xl px-4 dark:prose-invert sm:px-6 lg:px-8">
        <h1>Privacy Policy</h1>
        <p className="text-sm text-stone-500">Last updated: {site.privacyLastUpdated}</p>
        <h2>1. Who we are</h2>
        <p>
          Pawfect (“we”, “us”) provides a mobile application that helps you schedule and record pet health activities.
          Contact: privacy@pawfect.app
        </p>
        <h2>2. Data we collect</h2>
        <ul>
          <li>Account identifiers such as email or phone (depending on sign-in method).</li>
          <li>Pet profile data including name, species, date of birth, and lifestyle inputs you choose.</li>
          <li>Health records you enter: vaccines, deworming, visits, notes, and attachments metadata.</li>
          <li>Device and diagnostics needed to run the app (OS version, crash logs in development builds).</li>
          <li>Product analytics in aggregated form where enabled (no sale to advertisers).</li>
        </ul>
        <h2>3. How we use data</h2>
        <ul>
          <li>Generate schedules, reminders, and in-app notifications.</li>
          <li>Sync and backup your records across devices when you use cloud features.</li>
          <li>Improve reliability, security, and product experience.</li>
          <li>Respond to support requests and legal obligations.</li>
        </ul>
        <h2>4. What we do not do</h2>
        <ul>
          <li>We do not sell personal data. We do not share pet health data with advertisers.</li>
          <li>We do not use your private health records to train third-party AI models.</li>
        </ul>
        <h2>5. Retention</h2>
        <p>
          We retain account and pet data while your account is active. After you delete your account, we aim to remove
          personal and pet health data within 30 days, except where a longer period is required by law or dispute
          resolution.
        </p>
        <h2>6. Your rights (India — DPDP Act, 2023)</h2>
        <p>
          Depending on eligibility, you may request access, correction, erasure, or portability of your personal data.
          Email privacy@pawfect.app with your registered account details. We may verify identity before fulfilling
          requests.
        </p>
        <h2>7. Cookies & analytics</h2>
        <p>
          The marketing website may use privacy-oriented analytics. We do not use third-party advertising cookies for
          cross-site tracking on our properties.
        </p>
        <h2>8. Children</h2>
        <p>Pawfect is intended for adults managing pet care. Do not submit children’s personal data as pet owners.</p>
        <h2>9. Changes</h2>
        <p>We will update this page for material changes and revise the “Last updated” date above.</p>
      </article>
    </div>
  );
}
