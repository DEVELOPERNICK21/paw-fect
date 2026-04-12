import { tryGetAdminDb } from "@/lib/firebase-admin";
import type { WaitlistEntry } from "@/types";

const COLLECTION = "waitlist";

export async function addWaitlistEntry(input: {
  email: string;
  source: "web" | "app";
}): Promise<string> {
  const db = tryGetAdminDb();
  if (!db) {
    throw new Error("Database not configured");
  }
  const now = new Date().toISOString();
  const ref = await db.collection(COLLECTION).add({
    email: input.email.toLowerCase(),
    source: input.source,
    createdAt: now,
  });
  return ref.id;
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
  let rows: WaitlistEntry[] = snap.docs.map((d) => {
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
    rows = rows.filter((r) => r.email.includes(q));
  }
  return rows.slice(0, options.limit);
}

export async function deleteWaitlistEntry(id: string): Promise<void> {
  const db = tryGetAdminDb();
  if (!db) {
    throw new Error("Database not configured");
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
  const snap = await db
    .collection(COLLECTION)
    .where("createdAt", ">=", iso)
    .get();
  return snap.size;
}
