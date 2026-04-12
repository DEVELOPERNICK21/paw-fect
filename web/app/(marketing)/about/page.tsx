import { Card } from "@/components/ui/Card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Why we built Pawfect — vet-validated schedules, pet-first design, privacy, India-aware protocols.",
};

const values = [
  { title: "Vet-validated", body: "Schedules follow commonly used protocols — your vet finalizes care." },
  { title: "Pet-first", body: "Clarity for busy pet parents — fewer spreadsheets, fewer missed dates." },
  { title: "Privacy-safe", body: "Your pet data is for care and product improvement — not sold to advertisers." },
  { title: "India-aware", body: "Built with regional rabies and lifestyle context in mind." },
];

export default function AboutPage(): React.ReactElement {
  return (
    <div className="py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50">About Pawfect</h1>
        <p className="mt-6 text-xl font-medium text-stone-800 dark:text-stone-200">
          We believe every pet deserves the same level of healthcare attention that their owners give themselves.
        </p>
        <p className="mt-6 text-stone-600 dark:text-stone-400">
          Pawfect started from a simple frustration: missed boosters and scattered photos of vaccine booklets. We built
          an offline-friendly timeline that respects how real households manage multiple pets.
        </p>
        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {values.map((v) => (
            <Card key={v.title}>
              <h2 className="font-semibold text-stone-900 dark:text-stone-50">{v.title}</h2>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{v.body}</p>
            </Card>
          ))}
        </div>
        <h2 className="mt-20 text-2xl font-bold text-stone-900 dark:text-stone-50">Team</h2>
        <p className="mt-4 text-stone-600 dark:text-stone-400">Founder & team placeholders — update when you publish bios.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
              P
            </div>
            <p className="mt-4 font-semibold">Founder</p>
            <p className="text-sm text-stone-500">Product & pets</p>
          </Card>
          <Card>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
              T
            </div>
            <p className="mt-4 font-semibold">Team</p>
            <p className="text-sm text-stone-500">Engineering & design</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
