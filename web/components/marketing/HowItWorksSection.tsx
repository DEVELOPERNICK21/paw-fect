"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { motion, useReducedMotion } from "framer-motion";
import { Bell, Heart, UserPlus } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Add your pet",
    body:
      "Enter name, species, date of birth, and lifestyle. Pawfect builds your pet's health plan instantly.",
  },
  {
    icon: Bell,
    title: "Follow the schedule",
    body:
      "Get notified for vaccines, deworming, and milestones. Mark done in one tap; we recover the plan if you're late.",
  },
  {
    icon: Heart,
    title: "Watch them thrive",
    body: "Track completed milestones, view full history, and share records with your vet in one tap.",
  },
];

export function HowItWorksSection(): React.ReactElement {
  const reduce = useReducedMotion();

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-stone-50 py-24 dark:bg-stone-900/50 md:py-32"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/10 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <h2 className="text-center text-3xl font-bold text-stone-900 dark:text-stone-50 md:text-4xl">
            Three steps to a healthier pet
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-stone-600 dark:text-stone-400">
            A guided care loop designed for busy pet parents.
          </p>
        </AnimatedSection>

        <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((s, idx) => (
            <motion.li
              key={s.title}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="relative flex flex-col items-start border-t border-primary/30 pt-8"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-brand dark:text-stone-900">
                <s.icon className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-stone-900 dark:text-stone-100">
                {s.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                {s.body}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
