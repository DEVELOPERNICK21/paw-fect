"use client";

import type { PricingPlan } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type PlanDraft = {
  name: string;
  slug: string;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  maxPets: number;
  isPopular: boolean;
  isActive: boolean;
  badgeText?: string;
  ctaLabel: string;
  features: PricingPlan["features"];
};

const defaultFeatures: PricingPlan["features"] = [
  { label: "Basic schedule", included: true, sortOrder: 0 },
  { label: "History access", included: true, sortOrder: 1 },
  { label: "Support", included: true, sortOrder: 2 },
];

const emptyDraft = (): PlanDraft => ({
  name: "",
  slug: "",
  priceMonthly: 0,
  priceAnnual: 0,
  currency: "INR",
  maxPets: 1,
  isPopular: false,
  isActive: true,
  badgeText: "",
  ctaLabel: "Choose plan",
  features: defaultFeatures,
});

const planToDraft = (p: PricingPlan): PlanDraft => ({
  name: p.name,
  slug: p.slug,
  priceMonthly: p.priceMonthly,
  priceAnnual: p.priceAnnual,
  currency: p.currency,
  maxPets: p.maxPets,
  isPopular: p.isPopular,
  isActive: p.isActive,
  badgeText: p.badgeText,
  ctaLabel: p.ctaLabel,
  features: p.features?.length ? p.features : defaultFeatures,
});

export function PricingAdmin({ initialPlans }: { initialPlans: PricingPlan[] }): React.ReactElement {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlanDraft>(emptyDraft());
  const [isCreating, setIsCreating] = useState(false);

  async function reloadPlans(): Promise<void> {
    const r = await fetch("/api/admin/pricing");
    const j = (await r.json()) as { plans: PricingPlan[] };
    setPlans(j.plans);
  }

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
    await reloadPlans();
  }

  function startCreate(): void {
    setIsCreating(true);
    setEditingId(null);
    setDraft(emptyDraft());
    setMessage(null);
  }

  function startEdit(plan: PricingPlan): void {
    setEditingId(plan.id);
    setIsCreating(false);
    setDraft(planToDraft(plan));
    setMessage(null);
  }

  function stopEdit(): void {
    setEditingId(null);
    setIsCreating(false);
    setDraft(emptyDraft());
  }

  async function saveCreate(): Promise<void> {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = (await res.json()) as { id?: string; error?: string | Record<string, unknown> };
    setBusy(false);
    if (!res.ok) {
      setMessage(typeof data.error === "string" ? data.error : "Create failed");
      return;
    }
    setMessage("Plan created");
    stopEdit();
    await reloadPlans();
    router.refresh();
  }

  async function saveEdit(id: string): Promise<void> {
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/admin/pricing/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string | Record<string, unknown> };
    setBusy(false);
    if (!res.ok) {
      setMessage(typeof data.error === "string" ? data.error : "Update failed");
      return;
    }
    setMessage("Plan updated");
    stopEdit();
    await reloadPlans();
    router.refresh();
  }

  async function deactivate(id: string): Promise<void> {
    if (!confirm("Deactivate this plan?")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/pricing/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setMessage("Could not deactivate plan");
      return;
    }
    router.refresh();
    setPlans((p) =>
      p.map((x) => (x.id === id ? { ...x, isActive: false } : x)),
    );
    setMessage("Plan deactivated");
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
            onClick={() => startCreate()}
            disabled={busy}
          >
            Add plan
          </Button>
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
      {(isCreating || editingId) ? (
        <Card className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input id="planName" label="Name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            <Input id="planSlug" label="Slug" value={draft.slug} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))} />
            <Input id="planMonthly" label="Monthly price" type="number" value={String(draft.priceMonthly)} onChange={(e) => setDraft((d) => ({ ...d, priceMonthly: Number(e.target.value || "0") }))} />
            <Input id="planAnnual" label="Annual price" type="number" value={String(draft.priceAnnual)} onChange={(e) => setDraft((d) => ({ ...d, priceAnnual: Number(e.target.value || "0") }))} />
            <Input id="planMaxPets" label="Max pets" type="number" value={String(draft.maxPets)} onChange={(e) => setDraft((d) => ({ ...d, maxPets: Number(e.target.value || "1") }))} />
            <Input id="planCTA" label="CTA label" value={draft.ctaLabel} onChange={(e) => setDraft((d) => ({ ...d, ctaLabel: e.target.value }))} />
            <div className="flex items-center gap-2 pt-7">
              <input id="planPopular" type="checkbox" checked={draft.isPopular} onChange={(e) => setDraft((d) => ({ ...d, isPopular: e.target.checked }))} />
              <label htmlFor="planPopular" className="text-sm">Popular</label>
            </div>
            <div className="flex items-center gap-2 pt-7">
              <input id="planActive" type="checkbox" checked={draft.isActive} onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))} />
              <label htmlFor="planActive" className="text-sm">Active</label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {isCreating ? (
              <Button type="button" onClick={() => saveCreate()} disabled={busy}>Create</Button>
            ) : (
              <Button type="button" onClick={() => editingId && saveEdit(editingId)} disabled={busy}>Save changes</Button>
            )}
            <Button type="button" variant="ghost" onClick={() => stopEdit()} disabled={busy}>Cancel</Button>
          </div>
        </Card>
      ) : null}
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
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => startEdit(p)}>
                    Edit
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => deactivate(p.id)}>
                    Deactivate
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
