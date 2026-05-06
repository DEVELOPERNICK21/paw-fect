"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { motion, useReducedMotion } from "framer-motion";
import { Bell, CalendarCheck2, Heart, Sparkles, UserPlus } from "lucide-react";

const steps = [
  {
    n: 1,
    icon: UserPlus,
    title: "Add your pet",
    body:
      "Enter name, species, date of birth, and lifestyle. Pawfect builds your pet's health plan instantly.",
    chip: "60 sec setup",
  },
  {
    n: 2,
    icon: Bell,
    title: "Follow the schedule",
    body:
      "Get notified for vaccines, deworming, and milestones. Mark done in one tap — we recover the plan if you're late.",
    chip: "Smart reminders",
  },
  {
    n: 3,
    icon: Heart,
    title: "Watch them thrive",
    body: "Track completed milestones, view full history, and share records with your vet in one tap.",
    chip: "Progress you can trust",
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
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Care flow
          </p>
          <h2 className="text-center text-3xl font-bold text-stone-900 dark:text-stone-50 md:text-4xl">
            Three steps to a healthier pet
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-stone-600 dark:text-stone-400">
            A guided, stress-free care loop designed for busy pet parents.
          </p>
        </AnimatedSection>

        <div className="mt-14 flex items-center justify-center gap-8 text-xs text-stone-500 dark:text-stone-400 md:text-sm">
          <span className="inline-flex items-center gap-2">
            <CalendarCheck2 className="h-4 w-4 text-primary" />
            Personalized schedule
          </span>
          <span className="inline-flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Never miss reminders
          </span>
          <span className="hidden items-center gap-2 sm:inline-flex">
            <Sparkles className="h-4 w-4 text-primary" />
            Vet-ready history
          </span>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((s, idx) => (
            <motion.div
              key={s.n}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="relative"
            >
              {idx < steps.length - 1 ? (
                <div
                  className="absolute left-1/2 top-14 hidden h-px w-full bg-gradient-to-r from-primary/30 to-stone-200 md:block dark:to-stone-600"
                  style={{ width: "calc(100% - 2rem)", transform: "translateX(50%)" }}
                  aria-hidden
                />
              ) : null}

              <motion.div
                whileHover={reduce ? undefined : { y: -4, scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className="relative flex h-full flex-col items-center rounded-3xl border border-stone-200/80 bg-white/90 px-6 py-8 text-center shadow-sm backdrop-blur-sm dark:border-stone-700 dark:bg-stone-900/70"
              >
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  {s.chip}
                </span>
                <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-brand dark:text-stone-900">
                  <s.icon className="h-7 w-7" aria-hidden />
                </div>
                <span className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                  Step {s.n}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-stone-900 dark:text-stone-100">
                  {s.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                  {s.body}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
