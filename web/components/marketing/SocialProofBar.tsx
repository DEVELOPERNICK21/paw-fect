"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { CountUpNumber } from "@/components/ui/CountUpNumber";
import { Heart, Activity, Footprints, Route } from "lucide-react";

const stats = [
  { label: "Pet parents", sub: "and growing", value: 10000, suffix: "+", icon: Heart },
  { label: "On-time vaccines", sub: "reminder success", value: 98, suffix: "%", icon: Activity },
  { label: "Species", sub: "dogs & cats", value: 2, suffix: "", icon: Footprints },
  { label: "Life stages", sub: "tracked in-app", value: 6, suffix: "", icon: Route },
];

export function SocialProofBar(): React.ReactElement {
  return (
    <AnimatedSection className="border-y border-stone-200/80 bg-gradient-to-b from-cream/50 to-background py-12 dark:border-stone-700 dark:from-stone-900/40 dark:to-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
          Trusted by caring pet parents
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="group rounded-2xl border border-stone-200/90 bg-surface p-5 text-center shadow-sm transition hover:border-primary/30 hover:shadow-md dark:border-stone-700 dark:bg-stone-800/50"
            >
              <s.icon
                className="mx-auto h-6 w-6 text-primary opacity-80 transition group-hover:scale-110 group-hover:opacity-100"
                aria-hidden
              />
              <p className="mt-3 text-2xl font-black tabular-nums text-stone-900 dark:text-stone-50 sm:text-3xl">
                <CountUpNumber value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-800 dark:text-stone-200">{s.label}</p>
              <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
