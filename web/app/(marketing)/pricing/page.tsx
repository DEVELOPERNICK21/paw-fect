import { getActivePricingPlans } from "@/lib/data/pricing";
import { getSiteContentMarketing } from "@/lib/data/site-content";
import type { Metadata } from "next";
import { PricingFaq } from "@/components/marketing/PricingFaq";
import { PricingCards } from "@/components/marketing/PricingCards";
import { PricingComparisonTable } from "@/components/marketing/PricingComparisonTable";
import { Shield, Heart } from "lucide-react";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple plans for Indian pet households — start free, save more on annual billing.",
};

export default async function PricingPage(): Promise<React.ReactElement> {
  const [plans, site] = await Promise.all([getActivePricingPlans(), getSiteContentMarketing()]);

  return (
    <div className="relative overflow-hidden pb-20 pt-16 md:pb-28 md:pt-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[120%] -translate-x-1/2 bg-gradient-to-b from-primary/10 to-transparent dark:from-primary/5" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Pricing</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-stone-900 dark:text-stone-50 md:text-5xl">
            Plans that grow with your pets
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-stone-600 dark:text-stone-400">
            Start free to try the schedule. Most families pick <span className="font-semibold text-stone-800 dark:text-stone-200">Care+ on annual billing</span>{" "}
            — best balance of pets, history, and exports.
          </p>
          <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-stone-600 dark:text-stone-400">
            <span className="inline-flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" aria-hidden />
              Vet-aligned protocols
            </span>
            <span className="inline-flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" aria-hidden />
              Loved by busy pet parents
            </span>
          </div>
        </div>

        <div className="mt-16">
          <PricingCards plans={plans} variant="page" />
        </div>

        <section className="mt-20 md:mt-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50 md:text-3xl">Compare every feature</h2>
            <p className="mt-3 text-stone-600 dark:text-stone-400">
              See exactly what&apos;s included — pick the plan that matches your household.
            </p>
          </div>
          <div className="mt-10">
            <PricingComparisonTable plans={plans} />
          </div>
        </section>

        <PricingFaq items={site.pricingFaqs} />
      </div>
    </div>
  );
}
