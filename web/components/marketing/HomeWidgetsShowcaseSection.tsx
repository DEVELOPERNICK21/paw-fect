"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bell, Calendar, Scissors } from "lucide-react";

import { PawDotField } from "@/components/marketing/PetDecor";

export function HomeWidgetsShowcaseSection(): React.ReactElement {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden py-20 md:py-24">
      <PawDotField className="opacity-30" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark dark:text-primary">
            Phone home screen
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-stone-900 dark:text-stone-50 md:text-4xl">
            Same widgets on your launcher
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            On <strong className="font-semibold text-stone-800 dark:text-stone-200">Android</strong>, the{" "}
            <strong className="font-semibold text-stone-800 dark:text-stone-200">Next milestone</strong> and{" "}
            <strong className="font-semibold text-stone-800 dark:text-stone-200">Tasks</strong> home screen widgets
            mirror the in-app layout below — white cards, countdown pill, progress segments, and task rows. Data syncs
            when you open Pawfect. iOS requires a Widget Extension in Xcode.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* Next milestone — matches in-app + Android widget */}
          <motion.article
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05, duration: 0.4 }}
            className="rounded-[1.75rem] border border-stone-200/90 bg-white p-5 shadow-md dark:border-stone-600 dark:bg-stone-800"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg text-white shadow-sm"
                aria-hidden
              >
                🐾
              </div>
              <p className="min-w-0 flex-1 truncate text-lg font-bold text-stone-900 dark:text-stone-50">Tiger</p>
              <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                IN 12 DAYS
              </span>
            </div>
            <p className="mt-4 text-2xl font-extrabold leading-tight text-stone-900 dark:text-stone-50">
              Rabies Vaccination
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
              <Calendar className="h-4 w-4 shrink-0" aria-hidden />
              15 Apr 2026
            </p>
            <div className="mt-3 flex gap-1.5">
              <div className="h-1.5 flex-1 rounded-full bg-primary" />
              <div className="h-1.5 flex-1 rounded-full bg-stone-200 dark:bg-stone-600" />
              <div className="h-1.5 flex-1 rounded-full bg-stone-200 dark:bg-stone-600" />
            </div>
            <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/10 py-3 text-center text-sm font-bold text-primary-dark dark:border-primary/30 dark:bg-primary/15 dark:text-primary">
              Add to Calendar
            </div>
          </motion.article>

          {/* Tasks — matches in-app + Android widget */}
          <motion.article
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="rounded-[1.75rem] border border-stone-200/90 bg-white p-5 shadow-md dark:border-stone-600 dark:bg-stone-800"
          >
            <div className="flex items-center gap-2">
              <h3 className="flex-1 text-xl font-extrabold text-stone-900 dark:text-stone-50">Tasks</h3>
              <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary-dark dark:text-primary">
                2 Left
              </span>
              <span className="text-stone-400" aria-hidden>
                ⋮
              </span>
            </div>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2.5 dark:border-stone-600 dark:bg-stone-900/80">
                <span className="h-5 w-5 shrink-0 rounded border-2 border-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-900 dark:text-stone-50">Deworming</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">10:00 AM</p>
                </div>
                <Bell className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              </li>
              <li className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2.5 dark:border-stone-600 dark:bg-stone-900/80">
                <span className="h-5 w-5 shrink-0 rounded border-2 border-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-900 dark:text-stone-50">Grooming</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">3:00 PM</p>
                </div>
                <Scissors className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              </li>
              <li className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2.5 opacity-70 dark:border-stone-600 dark:bg-stone-900/80">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-primary bg-primary text-xs text-white">
                  ✓
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-500 line-through dark:text-stone-400">Breakfast</p>
                  <p className="text-xs italic text-stone-500 dark:text-stone-400">Done at 8:00 AM</p>
                </div>
              </li>
            </ul>
            <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/10 py-3 text-center text-sm font-bold text-primary-dark dark:border-primary/30 dark:bg-primary/15 dark:text-primary">
              + Add New Task
            </div>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
