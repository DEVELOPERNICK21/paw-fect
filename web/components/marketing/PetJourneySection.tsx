"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Button } from "@/components/ui/Button";
import { motion, useReducedMotion } from "framer-motion";
import { Footprints } from "lucide-react";
import { useState } from "react";

const stages = [
  {
    title: "Birth",
    age: "0-3 months",
    summary: "Foundational immunity and first health baseline.",
    points: ["Initial vaccine set", "Growth and feeding baseline", "Early wellness log"],
  },
  {
    title: "Young",
    age: "3-12 months",
    summary: "Critical booster window and habit-building period.",
    points: ["Booster reminders", "Deworming cadence", "Early behavior checkpoints"],
  },
  {
    title: "Adult",
    age: "1-6 years",
    summary: "Steady preventive care with reliable schedules.",
    points: ["Routine annual vaccines", "Regular deworming", "Complete care history"],
  },
  {
    title: "Mature",
    age: "6-8 years",
    summary: "Closer monitoring as metabolism and needs shift.",
    points: ["Adjusted reminder cadence", "Wellness trend visibility", "Early risk signals"],
  },
  {
    title: "Senior",
    age: "8-12 years",
    summary: "Proactive care with more frequent check-ins.",
    points: ["Age-aware schedule", "Medication/reminder support", "Vet-friendly summaries"],
  },
  {
    title: "Golden",
    age: "12+ years",
    summary: "Comfort-first care and continuity across every milestone.",
    points: ["Compassionate routine planning", "Shared caregiver visibility", "Legacy health timeline"],
  },
];

export function PetJourneySection(): React.ReactElement {
  const reduce = useReducedMotion();
  const [activeStage, setActiveStage] = useState(2);
  const active = stages[activeStage] ?? stages[2];

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
                  key={st.title}
                  initial={reduce ? false : { opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  className={`relative rounded-2xl border transition ${
                    i === activeStage
                      ? "border-primary/40 bg-white/90 shadow-md shadow-primary/10 dark:border-primary/30 dark:bg-stone-800/90"
                      : "border-transparent bg-white/40 dark:bg-stone-800/30"
                  }`}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setActiveStage(i)}
                    onFocus={() => setActiveStage(i)}
                    onClick={() => setActiveStage(i)}
                    className="flex w-full items-center gap-4 py-3 pl-8 pr-4 text-left"
                  >
                  <span className="absolute -left-0 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary bg-surface text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                    <span>
                      <span className="block text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {st.title}
                      </span>
                      <span className="block text-xs text-stone-500 dark:text-stone-400">
                        {st.age}
                      </span>
                    </span>
                  </button>
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
            See how needs change as your pet ages with a living timeline that
            keeps every stage clear, calm, and actionable.
          </p>
          <div className="mt-6 rounded-3xl border border-primary/20 bg-white/70 p-6 shadow-sm backdrop-blur-sm dark:border-primary/25 dark:bg-stone-900/60">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Active stage
            </p>
            <h3 className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-50">
              {active.title}
            </h3>
            <p className="mt-1 text-sm font-medium text-stone-500 dark:text-stone-400">
              {active.age}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {active.summary}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-stone-600 dark:text-stone-400">
              {active.points.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="text-primary" aria-hidden>
                    ✓
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-10">
            <Button href="/features#journey">Explore journey</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
