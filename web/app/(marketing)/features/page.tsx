import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Card } from "@/components/ui/Card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Vaccination schedules, deworming, pet journey, health records, reminders, and offline sync in Pawfect.",
};

export default function FeaturesPage(): React.ReactElement {
  return (
    <div className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50">Features</h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-600 dark:text-stone-400">
          Deep dive into how Pawfect keeps dog and cat health on track — from first vaccine to senior care.
        </p>

        <section id="vaccines" className="mt-16 scroll-mt-24">
          <AnimatedSection>
            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Smart vaccine scheduler</h2>
            <p className="mt-2 text-stone-600 dark:text-stone-400">
              Auto-generated schedules for core vaccines. Mark doses as given; we adjust upcoming reminders.
            </p>
          </AnimatedSection>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card>
              <p className="text-sm font-semibold text-primary">Dog — example core series</p>
              <table className="mt-4 w-full text-sm">
                <tbody>
                  <tr className="border-b border-stone-100 dark:border-stone-700">
                    <td className="py-2">DHPP</td>
                    <td className="py-2 text-stone-500">Series + boosters</td>
                  </tr>
                  <tr className="border-b border-stone-100 dark:border-stone-700">
                    <td className="py-2">Rabies</td>
                    <td className="py-2 text-stone-500">Per local law / vet</td>
                  </tr>
                </tbody>
              </table>
            </Card>
            <Card>
              <p className="text-sm font-semibold text-primary">Cat — example core series</p>
              <table className="mt-4 w-full text-sm">
                <tbody>
                  <tr className="border-b border-stone-100 dark:border-stone-700">
                    <td className="py-2">FVRCP</td>
                    <td className="py-2 text-stone-500">Kitten series + adult</td>
                  </tr>
                  <tr className="border-b border-stone-100 dark:border-stone-700">
                    <td className="py-2">Rabies</td>
                    <td className="py-2 text-stone-500">Per local law / vet</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>
        </section>

        <section id="deworming" className="mt-20 scroll-mt-24">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Deworming timeline</h2>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Intervals change with age and lifestyle. Pawfect surfaces the next due window and keeps history in one place.
          </p>
          <div className="mt-8 h-2 w-full rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
        </section>

        <section id="journey" className="mt-20 scroll-mt-24">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Pet journey stages</h2>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Six life stages with guidance for dogs and cats — milestones, care focus, and schedule shifts.
          </p>
        </section>

        <section id="records" className="mt-20 scroll-mt-24">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Health records</h2>
          <Card className="mt-6 max-w-md">
            <p className="text-xs uppercase text-stone-500">Record card</p>
            <p className="mt-2 font-semibold text-stone-900 dark:text-stone-50">Rabies — completed</p>
            <p className="text-sm text-stone-600 dark:text-stone-400">Batch no. · date · clinic</p>
          </Card>
        </section>

        <section id="notifications" className="mt-20 scroll-mt-24">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Notifications & reminders</h2>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Timely nudges before vaccines and deworming — tuned so you can act early, not last minute.
          </p>
        </section>

        <section id="offline" className="mt-20 scroll-mt-24">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Offline mode & sync</h2>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            View and log care without connectivity; sync when you are back online.
          </p>
        </section>

        <section id="multi-pet" className="mt-20 scroll-mt-24">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Multi-pet support</h2>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Switch pets instantly; each has its own timeline and records (limits vary by plan).
          </p>
        </section>
      </div>
    </div>
  );
}
