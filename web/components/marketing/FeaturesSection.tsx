"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarClock,
  Bug,
  Footprints,
  FileText,
  WifiOff,
  MapPin,
} from "lucide-react";
import { ScrollReveal } from "@/components/marketing/ScrollEffects";

const features = [
  {
    icon: CalendarClock,
    title: "Smart vaccine scheduler",
    body:
      "Vet-validated DHPP, FVRCP, and Rabies schedules auto-generated from your pet's date of birth. Never miss a critical dose.",
    featured: true,
  },
  {
    icon: Bug,
    title: "Deworming timeline",
    body:
      "From birth to senior, the right deworming interval for your pet's age and lifestyle: indoor, outdoor, and mixed.",
  },
  {
    icon: Footprints,
    title: "Pet journey stages",
    body:
      "A visual life stage timeline (Birth to Senior) showing what your pet needs at every age.",
  },
  {
    icon: FileText,
    title: "Smart health records",
    body:
      "Every vaccine, deworming, and vet visit logged and accessible. Export as PDF for boarding or travel.",
  },
  {
    icon: WifiOff,
    title: "Offline-first",
    body: "Pawfect works without internet. Records sync automatically when you're back online.",
  },
  {
    icon: MapPin,
    title: "India-aware protocols",
    body:
      "Rabies annual boosters, regional lifestyle risk, and local vet guidance baked in.",
  },
];

export function FeaturesSection(): React.ReactElement {
  const reduce = useReducedMotion();
  const [featured, ...rest] = features;

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 md:text-4xl lg:text-[2.5rem]">
            Everything your pet needs
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-stone-600 dark:text-stone-400">
            One app for schedules, records, and reminders, tuned to your pet&apos;s species and life
            stage.
          </p>
        </ScrollReveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <ScrollReveal direction="left" className="lg:col-span-5">
            <div className="flex h-full flex-col justify-between rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-cream to-surface p-8 shadow-card dark:from-primary/20 dark:via-stone-900 dark:to-stone-800">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-brand dark:text-stone-900">
                  <featured.icon className="h-7 w-7" aria-hidden />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-stone-900 dark:text-stone-50">
                  {featured.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-stone-600 dark:text-stone-300">
                  {featured.body}
                </p>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
            {rest.map((f, i) => (
              <motion.div
                key={f.title}
                initial={reduce ? false : { opacity: 0, y: 28 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px", amount: 0.25 }}
                transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                whileHover={reduce ? undefined : { y: -4 }}
                className={`rounded-2xl border border-stone-200/90 bg-surface p-6 shadow-sm dark:border-stone-700 dark:bg-stone-800/40 ${
                  i === rest.length - 1 && rest.length % 2 === 1 ? "sm:col-span-2" : ""
                }`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <f.icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-bold text-stone-900 dark:text-stone-100">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
