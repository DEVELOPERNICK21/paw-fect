"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PricingPlan } from "@/types";
import {
  effectiveMonthlyFromAnnual,
  yearlySavingsVsMonthly,
  type BillingCycle,
} from "@/lib/pricing-display";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";

type Props = {
  plans: PricingPlan[];
  /** Full pricing page shows toggle + richer layout; home preview is lighter. */
  variant?: "page" | "preview";
};

export function PricingCards({ plans, variant = "page" }: Props): React.ReactElement {
  const reduce = useReducedMotion();
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const showToggle = variant === "page";

  const sorted = [...plans].sort((a, b) => a.priceMonthly - b.priceMonthly);

  return (
    <div>
      {showToggle ? (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4">
          <p className="text-center text-sm font-medium text-stone-600 dark:text-stone-400">
            Most families save with <span className="text-primary">annual billing</span>. Two months on us.
          </p>
          <div
            className="inline-flex rounded-full border border-stone-200 bg-cream/80 p-1 shadow-inner dark:border-stone-600 dark:bg-stone-800/80"
            role="group"
            aria-label="Billing period"
          >
            <button
              type="button"
              onClick={() => setCycle("monthly")}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                cycle === "monthly"
                  ? "bg-surface text-stone-900 shadow-md dark:bg-stone-900 dark:text-stone-50"
                  : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setCycle("annual")}
              className={`relative rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                cycle === "annual"
                  ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-brand"
                  : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
              }`}
            >
              Annual
              <span className="ml-1.5 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                Best value
              </span>
            </button>
          </div>
          <p className="text-center text-xs text-stone-500 dark:text-stone-500">
            INR · Cancel anytime in app · No surprise charges
          </p>
        </div>
      ) : null}

      <div
        className={`mt-10 grid gap-6 lg:grid-cols-3 ${showToggle ? "lg:items-stretch" : ""} ${!showToggle ? "mt-0" : ""}`}
      >
        {sorted.map((p, i) => {
          const sym = p.currency === "INR" ? "₹" : "$";
          const monthlyDisplay = p.priceMonthly;
          const annualEffective = effectiveMonthlyFromAnnual(p.priceAnnual);
          const savings = yearlySavingsVsMonthly(p.priceMonthly, p.priceAnnual);
          const useAnnual = showToggle && cycle === "annual" && p.priceAnnual > 0;
          const priceShown = useAnnual ? annualEffective : monthlyDisplay;
          const periodLabel = useAnnual ? "/mo, billed annually" : "/mo";

          return (
            <motion.div
              key={p.id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className={`relative flex ${p.isPopular ? "lg:z-10" : ""}`}
            >
              {p.isPopular ? (
                <div className="absolute -top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-primary to-primary-dark px-4 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  {p.badgeText ?? "Most popular"}
                </div>
              ) : null}
              <Card
                className={`flex h-full w-full flex-col pt-2 transition duration-300 ${
                  p.isPopular
                    ? "border-2 border-primary bg-gradient-to-b from-primary/5 to-surface shadow-brand ring-1 ring-primary/20 dark:from-primary/10 dark:to-stone-900 lg:scale-[1.02] lg:shadow-xl"
                    : ""
                }`}
              >
                <div className="flex flex-1 flex-col">
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">{p.name}</h3>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    Up to <span className="font-semibold text-stone-700 dark:text-stone-300">{p.maxPets}</span> pets
                  </p>

                  <div className="mt-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black tabular-nums text-stone-900 dark:text-stone-50">
                        {sym}
                        {priceShown}
                      </span>
                      <span className="text-base font-medium text-stone-500">{periodLabel}</span>
                    </div>
                    {useAnnual && p.priceMonthly > 0 ? (
                      <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
                        Save {sym}
                        {savings}/year vs paying monthly
                      </p>
                    ) : null}
                    {useAnnual && p.priceAnnual > 0 ? (
                      <p className="mt-1 text-xs text-stone-500">
                        {sym}
                        {p.priceAnnual} charged once per year
                      </p>
                    ) : null}
                    {!useAnnual && p.priceMonthly > 0 && showToggle ? (
                      <p className="mt-2 text-xs text-stone-500">
                        Or {sym}
                        {annualEffective}/mo annual ({sym}
                        {p.priceAnnual}/yr). Save {sym}
                        {savings}
                      </p>
                    ) : null}
                  </div>

                  <ul className="mt-8 flex-1 space-y-3 text-sm">
                    {(variant === "preview" ? p.features.slice(0, 4) : p.features).map((f) => (
                      <li key={f.label} className="flex gap-3">
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            f.included
                              ? "bg-primary/15 text-primary dark:bg-primary/20"
                              : "bg-stone-100 text-stone-400 dark:bg-stone-800"
                          }`}
                        >
                          {f.included ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="text-xs">-</span>}
                        </span>
                        <span className={f.included ? "text-stone-700 dark:text-stone-300" : "text-stone-400 line-through"}>
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 space-y-3">
                    <Button
                      href="/download"
                      variant={p.isPopular ? "primary" : "secondary"}
                      className={`w-full justify-center ${
                        p.isPopular ? "!py-3.5 text-base shadow-brand" : "!py-3"
                      } ${
                        !p.isPopular && p.priceMonthly > 0
                          ? "!border-2 !border-primary !bg-primary/5 !text-primary-dark hover:!bg-primary/10 dark:!text-primary"
                          : ""
                      }`}
                    >
                      {p.priceMonthly === 0 ? "Get the app" : p.ctaLabel}
                    </Button>
                    <p className="text-center text-xs text-stone-500 dark:text-stone-500">
                      {p.priceMonthly === 0
                        ? "No credit card. Full basic schedule. Upgrade in app anytime"
                        : "Checkout in the app. Secure payment via App Store or Google Play"}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
      {showToggle ? (
        <p className="mx-auto mt-8 max-w-2xl text-center text-[11px] leading-relaxed text-stone-400 dark:text-stone-500">
          Subscriptions and refunds follow Apple / Google policies. Pawsoul provides scheduling tools only, not
          veterinary medical advice.
        </p>
      ) : null}
    </div>
  );
}
