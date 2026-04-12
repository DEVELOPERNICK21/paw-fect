"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { appGalleryScreenshots } from "@/lib/app-screenshots";
import { PawDotField } from "@/components/marketing/PetDecor";

export function AppGallerySection(): React.ReactElement {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-y border-stone-200/80 bg-stone-50/80 py-20 dark:border-stone-700 dark:bg-stone-900/40">
      <PawDotField className="opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark dark:text-primary">
            Inside the app
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-stone-900 dark:text-stone-50 md:text-4xl">
            Real screens — light &amp; dark
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            The same Pawfect experience on your phone: pet-first home, profiles, reminders, and
            notifications.
          </p>
        </motion.div>

        <div className="mt-10 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pl-4 pr-4 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
          {appGalleryScreenshots.map((item, i) => (
            <motion.figure
              key={item.id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.05, 0.35), duration: 0.4 }}
              className="w-[min(220px,78vw)] shrink-0 snap-center sm:w-auto"
            >
              <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-md dark:border-stone-600 dark:bg-stone-800">
                <div className="relative aspect-[9/19] w-full bg-stone-100 dark:bg-stone-900">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 220px, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <figcaption className="border-t border-stone-100 px-3 py-2 text-center text-xs font-semibold text-stone-600 dark:border-stone-700 dark:text-stone-300">
                  {item.label}
                </figcaption>
              </div>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
