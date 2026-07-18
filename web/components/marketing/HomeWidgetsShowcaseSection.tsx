"use client";

import { motion, useReducedMotion } from "framer-motion";

import { AppPhoneMockup } from "@/components/marketing/AppPhoneMockup";
import { PawDotField, WarmBlob } from "@/components/marketing/PetDecor";
import { downloadAppScreenshot, appGalleryScreenshots } from "@/lib/app-screenshots";

const companionShot =
  appGalleryScreenshots.find((s) => s.id === "care-actions") ?? appGalleryScreenshots[0];

export function HomeWidgetsShowcaseSection(): React.ReactElement {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden py-20 md:py-24">
      <PawDotField className="opacity-30" />
      <WarmBlob className="-right-16 top-10 h-64 w-64 opacity-60" blur="2xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-3xl font-black tracking-tight text-stone-900 dark:text-stone-50 md:text-4xl">
              Care on your home screen
            </h2>
            <p className="mt-4 max-w-lg text-stone-600 dark:text-stone-400">
              On Android, Next milestone and Tasks widgets mirror the in-app layout so upcoming care
              stays visible between opens. Data syncs when you launch Pawfect.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-stone-600 dark:text-stone-400">
              <li className="flex gap-2">
                <span className="text-primary" aria-hidden>
                  ✓
                </span>
                Countdown to the next vaccine or deworming
              </li>
              <li className="flex gap-2">
                <span className="text-primary" aria-hidden>
                  ✓
                </span>
                Today&apos;s care tasks without opening the app
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08, duration: 0.45 }}
            className="relative mx-auto flex w-full max-w-lg justify-center"
          >
            <div className="relative mx-auto h-[460px] w-full max-w-[380px] sm:h-[520px] sm:max-w-[420px]">
              <div className="absolute left-0 top-4 z-10 w-[62%] max-w-[260px] sm:max-w-[280px]">
                <AppPhoneMockup
                  image={downloadAppScreenshot}
                  alt="Pawfect home screen in light mode"
                  float={!reduce}
                  size="lg"
                />
              </div>
              <div className="absolute bottom-0 right-0 z-20 w-[56%] max-w-[220px] rotate-[6deg] sm:max-w-[240px]">
                <AppPhoneMockup
                  image={companionShot.src}
                  alt={companionShot.alt}
                  float={false}
                  size="md"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
