"use client";

import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { appGalleryScreenshots } from "@/lib/app-screenshots";
import { AppPhoneMockup } from "@/components/marketing/AppPhoneMockup";

const showcase = [
  appGalleryScreenshots.find((s) => s.id === "home-dark"),
  appGalleryScreenshots.find((s) => s.id === "home-light"),
  appGalleryScreenshots.find((s) => s.id === "care-actions"),
  appGalleryScreenshots.find((s) => s.id === "profile-hero"),
  appGalleryScreenshots.find((s) => s.id === "notifications"),
].filter((s): s is (typeof appGalleryScreenshots)[number] => Boolean(s));

export function AppGallerySection(): React.ReactElement {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(1); // light home as default center

  const left = showcase[(active - 1 + showcase.length) % showcase.length];
  const center = showcase[active];
  const right = showcase[(active + 1) % showcase.length];

  return (
    <section className="relative overflow-hidden border-y border-stone-200/70 bg-stone-950 py-14 text-stone-50 dark:border-stone-800 md:py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(242,140,40,0.22), transparent 55%), radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "auto, 22px 22px",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-8">
          <div className="max-w-xl">
            <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Real screens, light and dark
            </h2>
            <p className="mt-3 text-base text-stone-400 md:text-lg">
              Pet-first home, care actions, profiles, and reminders: the same Pawfect UI on your
              phone.
            </p>
          </div>
          <p className="hidden text-sm text-stone-500 md:block">Tap a label to stage that screen</p>
        </div>

        {/* Desktop / tablet: overlapping stage */}
        <div className="relative mt-10 hidden min-h-[520px] items-end justify-center md:flex lg:min-h-[560px]">
          <button
            type="button"
            aria-label={`Show ${left.label}`}
            onClick={() => setActive((active - 1 + showcase.length) % showcase.length)}
            className="absolute left-[4%] top-[12%] z-10 w-[28%] max-w-[240px] origin-bottom -rotate-[10deg] scale-90 opacity-80 transition hover:opacity-100 lg:left-[8%]"
          >
            <AppPhoneMockup
              image={left.src}
              alt={left.alt}
              float={false}
              size="md"
              variant="android"
            />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={center.id}
              initial={reduce ? false : { opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-20 w-[42%] max-w-[320px] drop-shadow-2xl"
            >
              <AppPhoneMockup
                image={center.src}
                alt={center.alt}
                float={!reduce}
                size="xl"
                variant="android"
                caption={center.label}
              />
            </motion.div>
          </AnimatePresence>

          <button
            type="button"
            aria-label={`Show ${right.label}`}
            onClick={() => setActive((active + 1) % showcase.length)}
            className="absolute right-[4%] top-[12%] z-10 w-[28%] max-w-[240px] origin-bottom rotate-[10deg] scale-90 opacity-80 transition hover:opacity-100 lg:right-[8%]"
          >
            <AppPhoneMockup
              image={right.src}
              alt={right.alt}
              float={false}
              size="md"
              variant="android"
            />
          </button>
        </div>

        {/* Mobile: single large phone + swipe chips */}
        <div className="mt-8 flex flex-col items-center md:hidden">
          <AppPhoneMockup
            image={center.src}
            alt={center.alt}
            float={!reduce}
            size="lg"
            variant="android"
            caption={center.label}
          />
        </div>

        <div
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
          role="tablist"
          aria-label="App screens"
        >
          {showcase.map((shot, i) => {
            const isActive = i === active;
            return (
              <button
                key={shot.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(i)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.98] ${
                  isActive
                    ? "bg-primary text-white shadow-brand dark:text-stone-900"
                    : "border border-white/15 bg-white/5 text-stone-300 hover:border-primary/40 hover:bg-white/10"
                }`}
              >
                {shot.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
