import type { PricingPlan } from "@/types";
import { mergeFeatureLabels, planIncludesFeature } from "@/lib/pricing-display";
import { Check, Minus } from "lucide-react";

export function PricingComparisonTable({ plans }: { plans: PricingPlan[] }): React.ReactElement {
  const sorted = [...plans].sort((a, b) => a.priceMonthly - b.priceMonthly);
  const rows = mergeFeatureLabels(sorted);

  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-surface shadow-sm dark:border-stone-700 dark:bg-stone-900/40">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">Compare features across Pawsoul plans</caption>
        <thead>
          <tr className="border-b border-stone-200 bg-cream/50 dark:border-stone-700 dark:bg-stone-800/50">
            <th scope="col" className="p-4 font-semibold text-stone-900 dark:text-stone-50">
              Feature
            </th>
            {sorted.map((p) => (
              <th
                key={p.id}
                scope="col"
                className={`p-4 text-center font-semibold ${
                  p.isPopular ? "bg-primary/10 text-primary-dark dark:bg-primary/15 dark:text-primary" : "text-stone-900 dark:text-stone-50"
                }`}
              >
                {p.name}
                {p.isPopular ? (
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-primary">
                    Recommended
                  </span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label }) => (
            <tr
              key={label}
              className="border-b border-stone-100 last:border-0 dark:border-stone-800"
            >
              <th scope="row" className="p-4 font-normal text-stone-700 dark:text-stone-300">
                {label}
              </th>
              {sorted.map((p) => {
                const ok = planIncludesFeature(p, label);
                return (
                  <td key={p.id} className="p-4 text-center">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-stone-50 dark:bg-stone-800">
                      {ok ? (
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} aria-label="Included" />
                      ) : (
                        <Minus className="h-4 w-4 text-stone-300 dark:text-stone-600" aria-label="Not included" />
                      )}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
