import { ContactForm } from "@/components/marketing/ContactForm";
import { Card } from "@/components/ui/Card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach the Pawfect team — support, press, partnerships, and feedback.",
};

export default function ContactPage(): React.ReactElement {
  return (
    <div className="py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50">Contact</h1>
          <p className="mt-4 text-stone-600 dark:text-stone-400">
            We read every message. For account issues, include your registered email.
          </p>
          <ContactForm />
        </div>
        <div className="space-y-6">
          <Card>
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">Email</p>
            <p className="mt-2 text-stone-600 dark:text-stone-400">hello@pawfect.app</p>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">Response time</p>
            <p className="mt-2 text-stone-600 dark:text-stone-400">We aim to reply within 2 business days.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
