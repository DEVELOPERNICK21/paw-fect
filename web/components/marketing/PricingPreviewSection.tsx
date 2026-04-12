"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import type { PricingPlan } from "@/types";
import { PricingCards } from "@/components/marketing/PricingCards";

export function PricingPreviewSection({ plans }: { plans: PricingPlan[] }): React.ReactElement {
  const reduce = useReducedMotion();

  return (
    <section className="relative py-24 md:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-cream/80 to-transparent dark:from-stone-900/50" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
            Plans for every household
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold text-stone-900 dark:text-stone-50 md:text-4xl">
            Simple pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-stone-600 dark:text-stone-400">
            Start free — upgrade when you need more pets, history, or PDF export.{" "}
            <span className="font-medium text-primary">Save on annual billing.</span>
          </p>
        </AnimatedSection>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mt-12"
        >
          <PricingCards plans={plans} variant="preview" />
        </motion.div>
        <p className="mt-10 text-center">
          <a
            href="/pricing"
            className="text-sm font-semibold text-primary underline-offset-4 transition hover:underline"
          >
            See full comparison &amp; FAQ →
          </a>
        </p>
      </div>
    </section>
  );
}
