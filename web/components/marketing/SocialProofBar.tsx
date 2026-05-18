"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { ShieldCheck, RefreshCcw, Footprints, WifiOff } from "lucide-react";

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

export function SocialProofBar(): React.ReactElement {
  return (
    <AnimatedSection className="border-y border-stone-200/80 bg-gradient-to-b from-cream/50 to-background py-12 dark:border-stone-700 dark:from-stone-900/40 dark:to-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
          What Pawfect is built around
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {pillars.map((p) => (
            <div
              key={p.label}
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
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
