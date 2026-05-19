import { tryGetAdminDb } from "@/lib/firebase-admin";
import type { WaitlistEntry } from "@/types";

const COLLECTION = "waitlist";

export class WaitlistError extends Error {
  constructor(
    readonly code: "NOT_CONFIGURED" | "DUPLICATE" | "FIRESTORE",
    message: string,
  ) {
    super(message);
    this.name = "WaitlistError";
  }
}

export function isWaitlistStorageReady(): boolean {
  return tryGetAdminDb() != null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findWaitlistByEmail(email: string): Promise<WaitlistEntry | null> {
  const db = tryGetAdminDb();
  if (!db) {
    return null;
  }
  const normalized = normalizeEmail(email);
  const snap = await db
    .collection(COLLECTION)
    .where("email", "==", normalized)
    .limit(1)
    .get();
  const doc = snap.docs[0];
  if (!doc) {
    return null;
  }
  const data = doc.data();
  return {
    id: doc.id,
    email: data.email as string,
    source: data.source as WaitlistEntry["source"],
    createdAt: data.createdAt as string,
  };
}

export async function addWaitlistEntry(input: {
  email: string;
  source: "web" | "app";
}): Promise<{ id: string; created: boolean }> {
  const db = tryGetAdminDb();
  if (!db) {
    throw new WaitlistError(
      "NOT_CONFIGURED",
      "Waitlist storage is not configured. Set Firebase Admin environment variables on the server.",
    );
  }

  const email = normalizeEmail(input.email);
  if (!email) {
    throw new WaitlistError("FIRESTORE", "Email is required.");
  }

  const existing = await findWaitlistByEmail(email);
  if (existing) {
    return { id: existing.id, created: false };
  }

  const now = new Date().toISOString();
  try {
    const ref = await db.collection(COLLECTION).add({
      email,
      source: input.source,
      createdAt: now,
    });
    return { id: ref.id, created: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save to waitlist.";
    throw new WaitlistError("FIRESTORE", message);
  }
}

export async function listWaitlist(options: {
  limit: number;
  search?: string;
}): Promise<WaitlistEntry[]> {
  const db = tryGetAdminDb();
  if (!db) {
    return [];
  }
  const snap = await db
    .collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(500)
    .get();
  let rows: WaitlistEntry[] = snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      email: data.email as string,
      source: data.source as WaitlistEntry["source"],
      createdAt: data.createdAt as string,
    };
  });
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    rows = rows.filter(r => r.email.includes(q));
  }
  return rows.slice(0, options.limit);
}

export async function deleteWaitlistEntry(id: string): Promise<void> {
  const db = tryGetAdminDb();
  if (!db) {
    throw new WaitlistError("NOT_CONFIGURED", "Database not configured");
  }
  await db.collection(COLLECTION).doc(id).delete();
}

export async function countWaitlistTotal(): Promise<number> {
  const db = tryGetAdminDb();
  if (!db) {
    return 0;
  }
  const snap = await db.collection(COLLECTION).get();
  return snap.size;
}

export async function countWaitlistThisWeek(): Promise<number> {
  const db = tryGetAdminDb();
  if (!db) {
    return 0;
  }
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const iso = weekAgo.toISOString();
  try {
    const snap = await db.collection(COLLECTION).where("createdAt", ">=", iso).get();
    return snap.size;
  } catch {
    return 0;
  }
}
