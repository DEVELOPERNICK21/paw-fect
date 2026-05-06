import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Delete your account — Pawfect",
  description:
    "How to request deletion of your Pawfect account and associated pet data. Pawfect pet health app.",
};

export default function DeleteAccountPage(): React.ReactElement {
  return (
    <div className="py-24 md:py-32">
      <article className="prose prose-stone mx-auto max-w-3xl px-4 dark:prose-invert sm:px-6 lg:px-8">
        <p className="not-prose text-sm font-medium uppercase tracking-wide text-stone-500">Pawfect</p>
        <h1>Delete your Pawfect account and data</h1>
        <p className="text-sm text-stone-500">
          This page explains how users of the <strong>Pawfect</strong> mobile app can request account deletion and what
          happens to their data.
        </p>

        <h2>How to request deletion</h2>
        <ol>
          <li>
            Send an email from the <strong>same address or phone-linked account</strong> you use with Pawfect to{" "}
            <a href="mailto:privacy@pawfect.app?subject=Pawfect%20account%20deletion%20request" className="text-stone-700 underline dark:text-stone-300">
              privacy@pawfect.app
            </a>
            .
          </li>
          <li>
            Use the subject line: <strong>Pawfect account deletion request</strong>.
          </li>
          <li>
            In the body, include your <strong>registered email address or phone number</strong> (the one you use to sign
            in) so we can verify ownership.
          </li>
        </ol>
        <p>
          We may ask a short follow-up to confirm identity before processing. For general help (not deletion), you can
          also use{" "}
          <Link href="/contact" className="text-stone-700 underline dark:text-stone-300">
            Contact
          </Link>{" "}
          or{" "}
          <a href="mailto:hello@pawfect.app" className="text-stone-700 underline dark:text-stone-300">
            hello@pawfect.app
          </a>
          .
        </p>

        <h2>What we delete</h2>
        <p>After we verify your request, we aim to delete:</p>
        <ul>
          <li>Your Pawfect account and authentication profile associated with that account.</li>
          <li>Pet profiles, schedules, and health records stored for that account (vaccination and deworming logs, notes, and related data you added).</li>
        </ul>

        <h2>What we may keep and for how long</h2>
        <ul>
          <li>
            We aim to complete deletion of personal and pet health data within <strong>30 days</strong> of a verified
            request, consistent with our{" "}
            <Link href="/privacy" className="text-stone-700 underline dark:text-stone-300">
              Privacy Policy
            </Link>
            .
          </li>
          <li>
            We may retain certain information longer where required by law, tax, or accounting rules, or for legitimate
            security and fraud-prevention (for example, minimal transaction or abuse-prevention records). Such data is not
            used for marketing after account closure.
          </li>
        </ul>

        <h2>Delete some data without closing your account</h2>
        <p>
          To correct or remove specific data while keeping your account, email{" "}
          <a href="mailto:privacy@pawfect.app" className="text-stone-700 underline dark:text-stone-300">
            privacy@pawfect.app
          </a>{" "}
          with details. We will respond under the timelines described in our Privacy Policy.
        </p>

        <p className="text-sm text-stone-500">© 2026 Pawfect. Pet health scheduling and records.</p>
      </article>
    </div>
  );
}
