"use client";

import type { PricingPlan } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
export function PricingAdmin({ initialPlans }: { initialPlans: PricingPlan[] }): React.ReactElement {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function seed(): Promise<void> {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/seed", { method: "POST" });
    const data = (await res.json()) as { created?: number; error?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error ?? "Failed");
      return;
    }
    setMessage(`Seeded ${data.created ?? 0} plans`);
    router.refresh();
    const r2 = await fetch("/api/admin/pricing");
    const j = (await r2.json()) as { plans: PricingPlan[] };
    setPlans(j.plans);
  }

  async function deactivate(id: string): Promise<void> {
    if (!confirm("Deactivate this plan?")) return;
    setBusy(true);
    await fetch(`/api/admin/pricing/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
    setPlans((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Pricing plans</h1>
          <p className="text-stone-600 dark:text-stone-400">Firestore collection: pricing_plans</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => seed()}
            disabled={busy}
            variant="secondary"
          >
            Seed defaults
          </Button>
        </div>
      </div>
      {message ? <p className="mt-4 text-sm text-stone-600">{message}</p> : null}
      <div className="mt-8 space-y-4">
        {plans.length === 0 ? (
          <Card>
            <p className="text-stone-600">No plans yet. Click &quot;Seed defaults&quot; or add via Firebase console.</p>
          </Card>
        ) : (
          plans.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-stone-900 dark:text-stone-50">{p.name}</p>
                  <p className="text-sm text-stone-500">
                    ₹{p.priceMonthly}/mo · {p.maxPets} pets · {p.isActive ? "active" : "inactive"}
                  </p>
                </div>
                <Button type="button" variant="ghost" onClick={() => deactivate(p.id)}>
                  Deactivate
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
      <p className="mt-8 text-xs text-stone-500">
        Full CRUD editor can be added later; plans can also be edited in Firebase Console.
      </p>
    </div>
  );
}
