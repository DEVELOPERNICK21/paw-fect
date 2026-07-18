"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/marketing/ScrollEffects";

const rows = [
  {
    pain: "Next vaccine date lives in a chat, sticky note, or guess",
    gain: "Auto schedule from date of birth, with reminders before it is due",
  },
  {
    pain: "Deworming interval forgotten until something feels off",
    gain: "Age and lifestyle based timeline that updates as your pet grows",
  },
  {
    pain: "Clinic visit with no clear history on your phone",
    gain: "Offline records you can open in the waiting room, then sync later",
  },
  {
    pain: "Boarding or travel asks for papers you cannot assemble",
    gain: "Logged care history ready to review or export on paid plans",
  },
] as const;

/**
 * Contrast frame: cost of the status quo vs. the app outcome.
 * Uses concrete product truths, not invented conversion metrics.
 */
export function ContrastSection(): React.ReactElement {
  const reduce = useReducedMotion();

  return (
    <section className="bg-cream/60 py-16 dark:bg-stone-900/40 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="max-w-2xl text-3xl font-black tracking-tight text-stone-900 dark:text-stone-50 md:text-4xl">
            Without a plan vs with Pawfect
          </h2>
          <p className="mt-4 max-w-2xl text-base text-stone-600 dark:text-stone-400 md:text-lg">
            Same pet. Same busy week. Different odds of remembering what matters.
          </p>
        </ScrollReveal>

        <div className="mt-10 overflow-hidden rounded-2xl border border-stone-200 bg-surface shadow-card dark:border-stone-700 dark:bg-stone-900/60">
          <div className="grid grid-cols-1 border-b border-stone-200 dark:border-stone-700 md:grid-cols-2">
            <div className="bg-stone-100/80 px-5 py-4 dark:bg-stone-950/50">
              <p className="text-sm font-bold text-stone-500">Without a schedule</p>
            </div>
            <div className="hidden bg-primary/10 px-5 py-4 md:block">
              <p className="text-sm font-bold text-primary-dark dark:text-primary">With Pawfect</p>
            </div>
          </div>

          <ul className="divide-y divide-stone-200 dark:divide-stone-700">
            {rows.map((row, i) => (
              <motion.li
                key={row.pain}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2"
              >
                <div className="flex gap-3 px-5 py-5 text-sm text-stone-600 dark:text-stone-400">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-200 text-stone-500 dark:bg-stone-800">
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span>
                    <span className="mb-1 block font-semibold text-stone-500 md:hidden">
                      Without a schedule
                    </span>
                    {row.pain}
                  </span>
                </div>
                <div className="flex gap-3 border-t border-stone-100 bg-primary/[0.04] px-5 py-5 text-sm text-stone-800 dark:border-stone-800 dark:bg-primary/10 dark:text-stone-200 md:border-t-0 md:border-l md:border-stone-200 dark:md:border-stone-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  <span>
                    <span className="mb-1 block font-semibold text-primary-dark dark:text-primary md:hidden">
                      With Pawfect
                    </span>
                    {row.gain}
                  </span>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Free forever plan. No credit card. Setup in about a minute.
          </p>
          <Button href="/download">Get the app</Button>
        </div>
      </div>
    </section>
  );
}
