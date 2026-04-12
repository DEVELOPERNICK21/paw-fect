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
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Card } from "@/components/ui/Card";

const features = [
  {
    icon: CalendarClock,
    title: "Smart vaccine scheduler",
    body:
      "Vet-validated DHPP, FVRCP, and Rabies schedules auto-generated from your pet's date of birth. Never miss a critical dose.",
  },
  {
    icon: Bug,
    title: "Deworming timeline",
    body:
      "From birth to senior, the right deworming interval for your pet's age and lifestyle — indoor, outdoor, and mixed.",
  },
  {
    icon: Footprints,
    title: "Pet journey stages",
    body:
      "A visual life stage timeline (Birth → Senior) showing what your pet needs at every age.",
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

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary dark:text-primary">
            Built for real pet life
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 md:text-4xl lg:text-[2.5rem]">
            Everything your pet needs
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-stone-600 dark:text-stone-400">
            One app for schedules, records, and reminders — tuned to your pet&apos;s species and life stage.
          </p>
        </AnimatedSection>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                whileHover={reduce ? undefined : { y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
              >
                <Card className="group h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 text-primary transition group-hover:from-primary/30 group-hover:to-accent/20">
                    <f.icon className="h-7 w-7" aria-hidden />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-stone-900 dark:text-stone-100">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{f.body}</p>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
