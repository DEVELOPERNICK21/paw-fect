import Link from "next/link";
import { CalendarCheck, FolderHeart, PawPrint } from "lucide-react";
import type { Metadata } from "next";

import { WaitlistForm } from "@/components/marketing/WaitlistForm";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Waitlist",
  description:
    "Join the Pawfect waitlist for product updates and news. Vet-aligned schedules, health records, and pet journey stages.",
};

const benefits = [
  {
    icon: CalendarCheck,
    title: "Vet-aligned schedules",
    body: "Vaccination and deworming timelines tailored for dogs and cats.",
  },
  {
    icon: FolderHeart,
    title: "Health records in one place",
    body: "Keep visits, vaccines, and notes organized without the paper chase.",
  },
  {
    icon: PawPrint,
    title: "Pet journey stages",
    body: "Know what care matters next as your pet grows.",
  },
] as const;

export default function WaitlistPage(): React.ReactElement {
  return (
    <div className="py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-start lg:px-8">
        <div>
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50">Join the waitlist</h1>
          <p className="mt-4 text-lg text-stone-600 dark:text-stone-400">
            Get product updates and news about Pawfect. No spam — unsubscribe anytime.
          </p>
          <ul className="mt-10 space-y-6">
            {benefits.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-stone-900 dark:text-stone-50">{title}</p>
                  <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <Card className="hover:translate-y-0 hover:shadow-card">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Notify me</h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            Drop your email and we&apos;ll let you know when there&apos;s news.
          </p>
          <div className="mt-6">
            <WaitlistForm />
          </div>
          <p className="mt-4 text-xs text-stone-500">
            We only use your email for waitlist updates. See our{" "}
            <Link
              href="/privacy"
              className="underline decoration-stone-400 underline-offset-2 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </Card>
      </div>
    </div>
  );
}
