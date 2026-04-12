import { Card } from "@/components/ui/Card";

export function SpeciesSection(): React.ReactElement {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-stone-900 dark:text-stone-50 md:text-4xl">
          Built for dogs. Built for cats.
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Dogs</p>
            <ul className="mt-4 list-inside list-disc space-y-2 text-stone-600 dark:text-stone-400">
              <li>Puppy DP, DHPPiL schedules</li>
              <li>Bordetella &amp; Lyme where relevant</li>
              <li>Lifestyle-based risk adjustments</li>
            </ul>
            <div className="mt-6 h-32 rounded-xl bg-stone-100 dark:bg-stone-800" aria-hidden />
          </Card>
          <Card>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Cats</p>
            <ul className="mt-4 list-inside list-disc space-y-2 text-stone-600 dark:text-stone-400">
              <li>FVRCP &amp; Rabies cadence</li>
              <li>FeLV for at-risk cats</li>
              <li>Indoor vs outdoor protocols</li>
            </ul>
            <div className="mt-6 h-32 rounded-xl bg-stone-100 dark:bg-stone-800" aria-hidden />
          </Card>
        </div>
      </div>
    </section>
  );
}
