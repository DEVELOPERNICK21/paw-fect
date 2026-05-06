import { FieldValue, type Firestore } from "firebase-admin/firestore";

import {
  computeEntitlement,
  type ComputedEntitlement,
  type StoredSubscriptionState,
} from "@repo-shared/subscription/entitlementEngine";

function toFirestoreEntitlement(e: ComputedEntitlement): Record<string, unknown> {
  return {
    plan: e.plan,
    source: e.source,
    maxPets: e.maxPets,
    historyMonthsCap: e.historyMonthsCap,
    pdfExport: e.pdfExport,
    offline: e.offline,
    sharing: e.sharing,
    multiUser: e.multiUser,
    vetPortal: e.vetPortal,
    prioritySupport: e.prioritySupport,
    trialActive: e.trialActive,
    trialEndsAt: e.trialEndsAt,
    trialConsumed: e.trialConsumed,
    graceActive: e.graceActive,
    gracePeriodEndsAt: e.gracePeriodEndsAt,
    computedAt: e.computedAt,
  };
}

export interface UserEntitlementSeed {
  trialEndsAt: string | null;
  trialConsumed: boolean;
  subscription: StoredSubscriptionState | null;
}

export async function writeComputedEntitlement(
  db: Firestore,
  uid: string,
  seed: UserEntitlementSeed,
): Promise<ComputedEntitlement> {
  const now = new Date();
  const computed = computeEntitlement({
    now,
    trialEndsAt: seed.trialEndsAt,
    trialConsumed: seed.trialConsumed,
    subscription: seed.subscription,
  });

  await db.collection("users").doc(uid).set(
    {
      entitlement: toFirestoreEntitlement(computed),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return computed;
}
