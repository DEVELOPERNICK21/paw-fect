"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Button } from "@/components/ui/Button";
import { motion, useReducedMotion } from "framer-motion";
import { Footprints } from "lucide-react";

const stages = ["Birth", "Young", "Adult", "Mature", "Senior", "Golden"];

export function PetJourneySection(): React.ReactElement {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/15 via-primary/10 to-background py-24 dark:from-primary/10 dark:via-stone-900/50 dark:to-background md:py-32">
      <div className="pointer-events-none absolute -right-20 top-20 text-[12rem] opacity-[0.07] dark:opacity-[0.05]">
        <Footprints aria-hidden />
      </div>
      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
        <AnimatedSection>
          <div className="relative pl-2">
            <div className="absolute bottom-2 left-[11px] top-2 w-0.5 rounded-full bg-gradient-to-b from-primary via-primary/50 to-transparent" />
            <div className="space-y-3">
              {stages.map((st, i) => (
                <motion.div
                  key={st}
                  initial={reduce ? false : { opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  className={`relative flex items-center gap-4 rounded-2xl border py-3 pl-8 pr-4 transition ${
                    i === 2
                      ? "border-primary/40 bg-white/90 font-semibold shadow-md shadow-primary/10 dark:border-primary/30 dark:bg-stone-800/90"
                      : "border-transparent bg-white/40 dark:bg-stone-800/30"
                  }`}
                >
                  <span className="absolute -left-0 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary bg-surface text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  {st}
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Life stages</p>
          <h2 className="mt-3 text-3xl font-bold text-stone-900 dark:text-stone-50 md:text-4xl lg:text-[2.5rem]">
            Pet journey
          </h2>
          <p className="mt-4 text-lg text-stone-600 dark:text-stone-400">
            See how needs change as your pet ages — vaccines, deworming, and milestones aligned to every stage.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-stone-600 dark:text-stone-400">
            <li className="flex gap-2">
              <span className="text-primary" aria-hidden>
                ✓
              </span>
              Clear “what’s next” for puppies & kittens through seniors
            </li>
            <li className="flex gap-2">
              <span className="text-primary" aria-hidden>
                ✓
              </span>
              Share-ready history for vet visits
            </li>
          </ul>
          <div className="mt-10">
            <Button href="/features#journey">Explore journey</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
