"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Lock, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { usePawPoints } from "@/components/gamification/PawPoints";
import { ScrollReveal } from "@/components/marketing/ScrollEffects";
import { effectiveMonthlyFromAnnual } from "@/lib/pricing-display";
import type { PricingPlan } from "@/types";

type Tier = "free" | "plus";

const ROWS: ReadonlyArray<{ label: string; free: string | null; plus: string }> = [
  { label: "Pets", free: "1 pet", plus: "Up to 3 pets" },
  { label: "Vaccine & deworming schedule", free: "Included", plus: "Included" },
  { label: "Care reminders", free: "Included", plus: "Included" },
  { label: "Health history", free: "Last 3 months", plus: "Unlimited" },
  { label: "Offline access with sync", free: null, plus: "Works without signal" },
  { label: "Wellness score & Pro care tasks", free: null, plus: "Unlocked" },
];

/**
 * Premium upsell: toggle between Free and Care+ and watch locked rows unlock.
 * Makes the value gap tangible before the pricing cards.
 */
export function PremiumUnlockSection({ plans }: { plans: PricingPlan[] }): React.ReactElement {
  const reduce = useReducedMotion();
  const { award } = usePawPoints();
  const [tier, setTierRaw] = useState<Tier>("free");
  const setTier = (t: Tier): void => { setTierRaw(t); award("premium-toggle", 10); };
  const plus = plans.find((p) => p.slug === "care-plus") ?? plans.find((p) => p.isPopular);
  const sym = plus?.currency === "INR" ? "₹" : "$";
  const monthly = plus ? effectiveMonthlyFromAnnual(plus.priceAnnual || plus.priceMonthly * 12) : null;

  return (
    <section className="relative overflow-hidden bg-stone-950 py-20 text-stone-50 md:py-28">
      <div className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-primary/25 blur-3xl" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <ScrollReveal direction="left">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Free to start, Care+ when you need more</p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl mt-2">Flip the switch. See what unlocks.</h2>
          <p className="mt-4 text-lg text-stone-300">
            Pawfect&apos;s free plan handles the essentials. Care+ is for households that want the full history, more pets
            and records that work even without signal.
          </p>
          {plus && monthly != null ? (
            <p className="mt-6 text-stone-300">
              Care+ from <span className="text-2xl font-bold text-white">{sym}{monthly}</span>
              <span className="text-sm">/mo billed annually (India price; your store shows your local price)</span>
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/pricing">Compare all plans</Button>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="right">
          <div className="rounded-3xl border border-white/[0.07] bg-white/5 p-5 backdrop-blur md:p-7">
            <div role="radiogroup" aria-label="Plan" className="relative mx-auto flex w-full max-w-xs rounded-full bg-white/10 p-1">
              {(["free", "plus"] as const).map((t) => {
                const active = tier === t;
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTier(t)}
                    className={`relative flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active ? "text-stone-900" : "text-stone-300"}`}
                  >
                    {active ? (
                      <motion.span
                        layoutId="tier-pill"
                        className="absolute inset-0 rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    ) : null}
                    <span className="relative inline-flex items-center gap-1.5">
                      {t === "plus" ? <Sparkles className="h-4 w-4" aria-hidden /> : null}
                      {t === "free" ? "Free" : "Care+"}
                    </span>
                  </button>
                );
              })}
            </div>

            <ul className="mt-6 space-y-2.5">
              {ROWS.map((r) => {
                const value = tier === "free" ? r.free : r.plus;
                const locked = value === null;
                return (
                  <li
                    key={r.label}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors duration-300 ${
                      locked ? "border-white/5 bg-white/[0.03] text-stone-500" : "border-white/[0.07] bg-white/10 text-stone-50"
                    }`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${locked ? "bg-white/10" : "bg-primary text-stone-900"}`}>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={locked ? "lock" : "check"}
                          initial={reduce ? false : { scale: 0.4, rotate: -40, opacity: 0 }}
                          animate={{ scale: 1, rotate: 0, opacity: 1 }}
                          exit={{ scale: 0.4, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 22 }}
                          className="flex"
                        >
                          {locked ? <Lock className="h-3.5 w-3.5" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                    <span className="flex-1 text-sm font-medium">{r.label}</span>
                    <span className="text-xs font-semibold">{locked ? "Care+" : value}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
