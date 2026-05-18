import type {
  DocumentReference,
  Firestore,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";

import { tryGetAdminDb } from "@/lib/firebase-admin";
import { parseUserBillingSeed } from "@/lib/subscription/parseUserBilling";
import {
  PLAN_CARE_PLUS,
  PLAN_FAMILY,
  PLAN_FREE,
  type PlanKey,
} from "@repo-shared/subscription/planCatalog";
import {
  computeEntitlement,
  type EntitlementSource,
} from "@repo-shared/subscription/entitlementEngine";

const USERS_PAGE = 400;
const PETS_PAGE = 400;

export interface AppMetrics {
  registeredUsers: number;
  usersWithPets: number;
  totalPets: number;
  petsAddedThisWeek: number;
  newUsersThisWeek: number;
  onboardingCompleted: number;
  activePaidSubscribers: number;
  activeTrialUsers: number;
  freeUsers: number;
  planBreakdown: Record<PlanKey, number>;
  paidByProvider: { razorpay: number; google_play: number };
  avgPetsPerPetParent: number;
}

function emptyAppMetrics(): AppMetrics {
  return {
    registeredUsers: 0,
    usersWithPets: 0,
    totalPets: 0,
    petsAddedThisWeek: 0,
    newUsersThisWeek: 0,
    onboardingCompleted: 0,
    activePaidSubscribers: 0,
    activeTrialUsers: 0,
    freeUsers: 0,
    planBreakdown: {
      [PLAN_FREE]: 0,
      [PLAN_CARE_PLUS]: 0,
      [PLAN_FAMILY]: 0,
    },
    paidByProvider: { razorpay: 0, google_play: 0 },
    avgPetsPerPetParent: 0,
  };
}

function weekAgoIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

function petOwnerIdFromRef(ref: DocumentReference): string | null {
  // users/{uid}/pets/{petId}
  const userRef = ref.parent.parent;
  return userRef?.id ?? null;
}

async function aggregatePets(
  db: Firestore,
  sinceIso: string,
): Promise<{
  totalPets: number;
  petsAddedThisWeek: number;
  usersWithPets: number;
}> {
  const petParentIds = new Set<string>();
  let totalPets = 0;
  let petsAddedThisWeek = 0;
  let lastDoc: QueryDocumentSnapshot | undefined;

  while (true) {
    let query = db.collectionGroup("pets").limit(PETS_PAGE);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }
    const snap = await query.get();
    if (snap.empty) {
      break;
    }
    for (const doc of snap.docs) {
      totalPets += 1;
      const ownerId = petOwnerIdFromRef(doc.ref);
      if (ownerId) {
        petParentIds.add(ownerId);
      }
      const createdAt = doc.data().createdAt;
      if (typeof createdAt === "string" && createdAt >= sinceIso) {
        petsAddedThisWeek += 1;
      }
    }
    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < PETS_PAGE) {
      break;
    }
  }

  return {
    totalPets,
    petsAddedThisWeek,
    usersWithPets: petParentIds.size,
  };
}

function bumpSource(
  counts: { paid: number; trial: number; free: number },
  source: EntitlementSource,
): void {
  if (source === "paid") {
    counts.paid += 1;
  } else if (source === "trial") {
    counts.trial += 1;
  } else {
    counts.free += 1;
  }
}

async function aggregateUsers(
  db: Firestore,
  sinceIso: string,
): Promise<{
  registeredUsers: number;
  newUsersThisWeek: number;
  onboardingCompleted: number;
  activePaidSubscribers: number;
  activeTrialUsers: number;
  freeUsers: number;
  planBreakdown: Record<PlanKey, number>;
  paidByProvider: { razorpay: number; google_play: number };
}> {
  const now = new Date();
  const sourceCounts = { paid: 0, trial: 0, free: 0 };
  const planBreakdown: Record<PlanKey, number> = {
    [PLAN_FREE]: 0,
    [PLAN_CARE_PLUS]: 0,
    [PLAN_FAMILY]: 0,
  };
  const paidByProvider = { razorpay: 0, google_play: 0 };
  let registeredUsers = 0;
  let newUsersThisWeek = 0;
  let onboardingCompleted = 0;
  let lastDoc: QueryDocumentSnapshot | undefined;

  while (true) {
    let query = db.collection("users").limit(USERS_PAGE);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }
    const snap = await query.get();
    if (snap.empty) {
      break;
    }
    for (const doc of snap.docs) {
      registeredUsers += 1;
      const data = doc.data() as Record<string, unknown>;
      if (data.onboardingCompleted === true) {
        onboardingCompleted += 1;
      }
      const createdAt =
        typeof data.createdAt === "string" ? data.createdAt : null;
      if (createdAt != null && createdAt >= sinceIso) {
        newUsersThisWeek += 1;
      }

      const billing = parseUserBillingSeed(data);
      const computed = computeEntitlement({
        now,
        trialEndsAt: billing.trialEndsAt,
        trialConsumed: billing.trialConsumed,
        subscription: billing.subscription,
      });

      bumpSource(sourceCounts, computed.source);
      planBreakdown[computed.plan] += 1;

      if (computed.source === "paid" && billing.subscription) {
        if (billing.subscription.provider === "razorpay") {
          paidByProvider.razorpay += 1;
        } else if (billing.subscription.provider === "google_play") {
          paidByProvider.google_play += 1;
        }
      }
    }
    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < USERS_PAGE) {
      break;
    }
  }

  return {
    registeredUsers,
    newUsersThisWeek,
    onboardingCompleted,
    activePaidSubscribers: sourceCounts.paid,
    activeTrialUsers: sourceCounts.trial,
    freeUsers: sourceCounts.free,
    planBreakdown,
    paidByProvider,
  };
}

/** Mobile app metrics from Firestore (`users`, `users/{uid}/pets`). */
export async function getAppMetrics(): Promise<AppMetrics> {
  const db = tryGetAdminDb();
  if (!db) {
    return emptyAppMetrics();
  }

  const sinceIso = weekAgoIso();

  try {
    const [pets, users] = await Promise.all([
      aggregatePets(db, sinceIso),
      aggregateUsers(db, sinceIso),
    ]);

    const avgPetsPerPetParent =
      pets.usersWithPets > 0
        ? Math.round((pets.totalPets / pets.usersWithPets) * 10) / 10
        : 0;

    return {
      ...users,
      usersWithPets: pets.usersWithPets,
      totalPets: pets.totalPets,
      petsAddedThisWeek: pets.petsAddedThisWeek,
      avgPetsPerPetParent,
    };
  } catch {
    return emptyAppMetrics();
  }
}
