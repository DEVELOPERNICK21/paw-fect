import type { PricingPlan } from "@/types";

export type BillingCycle = "monthly" | "annual";

export function effectiveMonthlyFromAnnual(priceAnnual: number): number {
  if (priceAnnual <= 0) {
    return 0;
  }
  return Math.round(priceAnnual / 12);
}

export function yearlySavingsVsMonthly(priceMonthly: number, priceAnnual: number): number {
  return Math.max(0, priceMonthly * 12 - priceAnnual);
}

export function mergeFeatureLabels(plans: PricingPlan[]): { label: string; sortOrder: number }[] {
  const map = new Map<string, number>();
  for (const p of plans) {
    for (const f of p.features) {
      const prev = map.get(f.label);
      if (prev === undefined || f.sortOrder < prev) {
        map.set(f.label, f.sortOrder);
      }
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([label, sortOrder]) => ({ label, sortOrder }));
}

export function planIncludesFeature(plan: PricingPlan, label: string): boolean {
  const row = plan.features.find((f) => f.label === label);
  return row?.included ?? false;
}
