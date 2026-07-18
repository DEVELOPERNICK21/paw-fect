"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Shield,
  Smartphone,
  WifiOff,
  Globe,
  ShieldCheck,
  RefreshCcw,
  Footprints,
} from "lucide-react";
import type { SiteContentMarketing } from "@/types";

const iconMap = [Shield, Smartphone, WifiOff, Globe];

const pillars = [
  {
    label: "Standard care protocols",
    sub: "DHPP, FVRCP, Rabies, deworming",
    icon: ShieldCheck,
  },
  {
    label: "Self-adjusting schedules",
    sub: "Recalculates when you miss a dose",
    icon: RefreshCcw,
  },
  {
    label: "Dogs & cats",
    sub: "Puppy / kitten to senior",
    icon: Footprints,
  },
  {
    label: "Offline-first",
    sub: "Works at the vet with no signal",
    icon: WifiOff,
  },
];

export function SocialProofBar({
  trustBadges,
}: {
  trustBadges?: SiteContentMarketing["trustBadges"];
}): React.ReactElement {
  const reduce = useReducedMotion();
  const badges = trustBadges ?? [];

  return (
    <section className="border-y border-stone-200/80 bg-gradient-to-b from-cream/50 to-background py-12 dark:border-stone-700 dark:from-stone-900/40 dark:to-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {badges.length > 0 ? (
          <ul className="mb-10 flex flex-wrap items-center justify-center gap-3">
            {badges.map((text, i) => {
              const Icon = iconMap[i % iconMap.length];
              return (
                <motion.li
                  key={text}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200/90 bg-surface/90 px-4 py-2 text-sm font-medium text-stone-700 shadow-sm dark:border-stone-600 dark:bg-stone-800/80 dark:text-stone-200"
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {text}
                </motion.li>
              );
            })}
          </ul>
        ) : null}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <motion.div
              key={p.label}
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ delay: 0.08 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              whileHover={reduce ? undefined : { y: -4 }}
              className="group rounded-2xl border border-stone-200/90 bg-surface p-5 text-center shadow-sm transition hover:border-primary/30 hover:shadow-md dark:border-stone-700 dark:bg-stone-800/50"
            >
              <p.icon
                className="mx-auto h-7 w-7 text-primary opacity-80 transition group-hover:scale-110 group-hover:opacity-100"
                aria-hidden
              />
              <p className="mt-3 text-base font-bold text-stone-900 dark:text-stone-50 sm:text-lg">
                {p.label}
              </p>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{p.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
