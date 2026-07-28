"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Clock3, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/marketing/ScrollEffects";

const reasons = [
  {
    icon: Clock3,
    title: "Small commitment, clear payoff",
    body: "Add your pet once. Pawsoul builds the care timeline so you are not rebuilding it every month.",
  },
  {
    icon: ShieldCheck,
    title: "Risk removed from trying",
    body: "Start on the free plan. No card required. Upgrade only if you need more pets, history, or PDF export.",
  },
  {
    icon: Smartphone,
    title: "Help when you are already busy",
    body: "Reminders and offline access show up at the clinic, not only when you are at a desk.",
  },
] as const;

/**
 * Commitment + risk-reversal block: makes the first step feel small and safe.
 */
export function CommitmentSection(): React.ReactElement {
  const reduce = useReducedMotion();

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="max-w-2xl text-3xl font-black tracking-tight text-stone-900 dark:text-stone-50 md:text-4xl">
            Why people download today, not &ldquo;later&rdquo;
          </h2>
          <p className="mt-4 max-w-2xl text-base text-stone-600 dark:text-stone-400 md:text-lg">
            &ldquo;Later&rdquo; is how booster windows slip. The download is free. The cost of waiting
            is another date you meant to track.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {reasons.map((r, i) => (
            <motion.article
              key={r.title}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-stone-200 bg-surface p-6 shadow-sm dark:border-stone-700 dark:bg-stone-800/40"
            >
              <r.icon className="h-6 w-6 text-primary" aria-hidden />
              <h3 className="mt-4 text-lg font-bold text-stone-900 dark:text-stone-50">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{r.body}</p>
            </motion.article>
          ))}
        </div>

        <div className="mt-10">
          <Button href="/download">Get the app</Button>
        </div>
      </div>
    </section>
  );
}
