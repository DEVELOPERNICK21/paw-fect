"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CalendarX2, FileWarning, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/marketing/ScrollEffects";

const losses = [
  {
    icon: CalendarX2,
    title: "Missed booster windows",
    body: "A late DHPP or rabies dose is easy to overlook when dates live in your head or a dusty booklet.",
  },
  {
    icon: FileWarning,
    title: "Records you cannot find",
    body: "Boarding, travel, and new vets ask for history. Phone photos of paper cards rarely add up cleanly.",
  },
  {
    icon: HelpCircle,
    title: "Guesswork at the clinic",
    body: "Without a timeline, you leave appointments unsure what is next, or pay for visits you could have planned.",
  },
  {
    icon: AlertTriangle,
    title: "Quiet deworming gaps",
    body: "Age and lifestyle change the interval. Skipping months feels fine until a parasite problem shows up.",
  },
] as const;

/**
 * Loss-aversion block: names concrete costs of unmanaged pet schedules
 * without inventing stats or medical scare copy.
 */
export function LossAversionSection(): React.ReactElement {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-stone-950 py-16 text-stone-50 md:py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(242,140,40,0.18), transparent 45%), radial-gradient(circle at 80% 80%, rgba(196,92,18,0.12), transparent 40%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="max-w-2xl text-3xl font-black tracking-tight text-white md:text-4xl">
            What slips when care lives in memory
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone-400 md:text-lg">
            Most pet parents are not careless. They are busy. Without a shared timeline, the same
            gaps keep showing up: late doses, missing papers, and last-minute panic.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {losses.map((item, i) => (
            <motion.article
              key={item.title}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
            >
              <item.icon className="h-6 w-6 text-primary" aria-hidden />
              <h3 className="mt-4 text-base font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-400">{item.body}</p>
            </motion.article>
          ))}
        </div>

        <ScrollReveal delay={0.1} className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm font-medium text-stone-300 md:text-base">
            Pawfect keeps the next dose, the life stage, and the record in one place so those gaps
            stop being normal.
          </p>
          <Button href="/download" className="shrink-0 !px-7">
            Get the app
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}
