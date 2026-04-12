import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms of use for the Pawfect pet health scheduling application.",
};

export default function TermsPage(): React.ReactElement {
  return (
    <div className="py-24 md:py-32">
      <article className="prose prose-stone mx-auto max-w-3xl px-4 dark:prose-invert sm:px-6 lg:px-8">
        <h1>Terms &amp; Conditions</h1>
        <h2>1. Acceptance</h2>
        <p>By using Pawfect, you agree to these terms. If you disagree, do not use the service.</p>
        <h2>2. The service</h2>
        <p>
          Pawfect provides scheduling, reminders, and record-keeping tools for pet health. It is informational software,
          <strong> not veterinary advice</strong>. Always consult a licensed veterinarian for diagnosis and treatment.
        </p>
        <h2>3. Accounts</h2>
        <p>
          You are responsible for accurate information you enter and for safeguarding your credentials. Notify us if you
          suspect unauthorized access.
        </p>
        <h2>4. Subscriptions & billing</h2>
        <p>
          Paid plans may renew automatically until cancelled in accordance with app-store rules. Refunds follow platform
          policies unless required otherwise by law.
        </p>
        <h2>5. Acceptable use</h2>
        <p>
          Do not misuse the service, attempt to access others’ data, or enter fraudulent records. Commercial resale of
          the app or its data without permission is prohibited.
        </p>
        <h2>6. Intellectual property</h2>
        <p>Pawfect branding, software, and content are protected. You receive a limited license to use the app.</p>
        <h2>7. Disclaimers</h2>
        <p>
          Health timelines are based on protocols and your inputs — they may not fit every animal. The service is
          provided “as is” without warranties of fitness for a particular medical outcome.
        </p>
        <h2>8. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Pawfect is not liable for indirect or consequential damages arising
          from use of the service.
        </p>
        <h2>9. Governing law</h2>
        <p>These terms are governed by the laws of India. Courts at Bengaluru, India shall have exclusive jurisdiction.</p>
        <h2>10. Contact</h2>
        <p>legal@pawfect.app</p>
      </article>
    </div>
  );
}
