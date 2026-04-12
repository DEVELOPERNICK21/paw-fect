import { tryGetAdminDb } from "@/lib/firebase-admin";
import type { PricingPlan } from "@/types";
import { defaultPricingPlans } from "@/lib/data/defaults";

const COLLECTION = "pricing_plans";

function docToPlan(
  id: string,
  data: Record<string, unknown>,
): PricingPlan {
  return {
    id,
    name: data.name as string,
    slug: data.slug as string,
    priceMonthly: data.priceMonthly as number,
    priceAnnual: data.priceAnnual as number,
    currency: (data.currency as string) ?? "INR",
    maxPets: data.maxPets as number,
    isPopular: Boolean(data.isPopular),
    isActive: Boolean(data.isActive),
    badgeText: data.badgeText as string | undefined,
    ctaLabel: data.ctaLabel as string,
    features: (data.features as PricingPlan["features"]) ?? [],
    createdAt: data.createdAt as string | undefined,
    updatedAt: data.updatedAt as string | undefined,
  };
}

export async function getActivePricingPlans(): Promise<PricingPlan[]> {
  try {
    const db = tryGetAdminDb();
    if (!db) {
      return defaultPricingPlans().map((p, i) => ({
        ...p,
        id: `default-${i}`,
      }));
    }
    const snap = await db
      .collection(COLLECTION)
      .where("isActive", "==", true)
      .get();
    if (snap.empty) {
      return defaultPricingPlans().map((p, i) => ({
        ...p,
        id: `default-${i}`,
      }));
    }
    const plans = snap.docs.map((d) => docToPlan(d.id, d.data()));
    return plans.sort((a, b) => a.priceMonthly - b.priceMonthly);
  } catch {
    return defaultPricingPlans().map((p, i) => ({
      ...p,
      id: `default-${i}`,
    }));
  }
}

export async function getAllPricingPlans(): Promise<PricingPlan[]> {
  const db = tryGetAdminDb();
  if (!db) {
    return [];
  }
  const snap = await db.collection(COLLECTION).orderBy("priceMonthly").get();
  return snap.docs.map((d) => docToPlan(d.id, d.data()));
}

export async function createPricingPlan(
  input: Omit<PricingPlan, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const db = tryGetAdminDb();
  if (!db) {
    throw new Error("Database not configured");
  }
  const now = new Date().toISOString();
  const ref = await db.collection(COLLECTION).add({
    ...input,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updatePricingPlan(
  id: string,
  input: Partial<Omit<PricingPlan, "id" | "createdAt">>,
): Promise<void> {
  const db = tryGetAdminDb();
  if (!db) {
    throw new Error("Database not configured");
  }
  await db
    .collection(COLLECTION)
    .doc(id)
    .set(
      {
        ...input,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
}

export async function softDeletePricingPlan(id: string): Promise<void> {
  const db = tryGetAdminDb();
  if (!db) {
    throw new Error("Database not configured");
  }
  await db.collection(COLLECTION).doc(id).update({
    isActive: false,
    updatedAt: new Date().toISOString(),
  });
}

export async function countActivePlans(): Promise<number> {
  const db = tryGetAdminDb();
  if (!db) {
    return 0;
  }
  const snap = await db
    .collection(COLLECTION)
    .where("isActive", "==", true)
    .get();
  return snap.size;
}
