import { tryGetAdminDb } from "@/lib/firebase-admin";
import { defaultPricingPlans } from "@/lib/data/defaults";

const COLLECTION = "pricing_plans";

export async function seedDefaultPricingPlans(): Promise<number> {
  const db = tryGetAdminDb();
  if (!db) {
    throw new Error("Database not configured");
  }
  const existing = await db.collection(COLLECTION).limit(1).get();
  if (!existing.empty) {
    return 0;
  }
  const batch = db.batch();
  const now = new Date().toISOString();
  let count = 0;
  for (const plan of defaultPricingPlans()) {
    const ref = db.collection(COLLECTION).doc();
    batch.set(ref, {
      ...plan,
      createdAt: now,
      updatedAt: now,
    });
    count += 1;
  }
  await batch.commit();
  return count;
}
