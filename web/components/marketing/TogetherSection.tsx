"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { useState } from "react";
import { ScrollReveal } from "@/components/marketing/ScrollEffects";
import { StoreButtons } from "@/components/marketing/StoreButtons";
import { HeartBurst } from "@/components/marketing/HeartBurst";

function line(years: number): string {
  if (years < 1) return "Every first is happening right now: first shots, first walks, first sleepy cuddles.";
  if (years < 4) return "Years of zoomies, naps and knowing exactly what your face means.";
  if (years < 9) return "They know your routines better than you do. Keep their care as steady as their love.";
  return "A lifetime of loyalty. Regular checkups and tidy records matter more every year.";
}

/** Emotional, interactive: how long have we been together, and what's next. */
export function TogetherSection(): React.ReactElement {
  const reduce = useReducedMotion();
  const [years, setYears] = useState(3);
  const [burst, setBurst] = useState(0);
  const days = Math.max(30, Math.round(years * 365));
  const label = years < 1 ? "just a few months" : `${years} ${years === 1 ? "year" : "years"}`;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-rose-500/[0.06] via-primary/[0.06] to-transparent py-20 md:py-28">
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <ScrollReveal>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Because time flies</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 md:text-4xl">
            How long have you been each other&apos;s favourite?
          </h2>
        </ScrollReveal>

        <div className="relative mt-10 rounded-3xl bg-surface p-8 shadow-card ring-1 ring-black/5 dark:bg-stone-900/70 dark:ring-white/10 md:p-12">
          <HeartBurst burst={burst} />
          <label htmlFor="together-years" className="text-sm font-semibold text-stone-600 dark:text-stone-300">
            Together for {label}
          </label>
          <input
            id="together-years"
            type="range"
            min={0}
            max={15}
            step={1}
            value={years}
            onChange={(e) => {
              setYears(Number(e.target.value));
              setBurst((b) => b + 1);
            }}
            className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-primary dark:bg-stone-700"
          />
          <div className="mt-8 flex items-center justify-center gap-3">
            <Heart className="h-8 w-8 fill-rose-400 text-rose-400" aria-hidden />
            <motion.span
              key={days}
              initial={reduce ? false : { scale: 0.9, opacity: 0.4 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-black tabular-nums text-stone-900 dark:text-stone-50 md:text-6xl"
            >
              {days.toLocaleString()}
            </motion.span>
          </div>
          <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-stone-500">days of love so far</p>
          <p className="mx-auto mt-6 max-w-lg text-lg text-stone-700 dark:text-stone-300">{line(years)}</p>
          <p className="mx-auto mt-2 max-w-lg text-stone-600 dark:text-stone-400">
            Pawfect keeps the vaccines, deworming and checkups on time, so the next thousand days are as healthy as they can be.
          </p>
          <div className="mt-8 flex justify-center">
            <StoreButtons source="together" />
          </div>
        </div>
      </div>
    </section>
  );
}
