import { tryGetAdminDb } from "@/lib/firebase-admin";
import type { ContactSubmission } from "@/types";

const COLLECTION = "contact_submissions";

export async function createContactSubmission(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<string> {
  const db = tryGetAdminDb();
  if (!db) {
    throw new Error("Database not configured");
  }
  const now = new Date().toISOString();
  const ref = await db.collection(COLLECTION).add({
    ...input,
    status: "new",
    createdAt: now,
  });
  return ref.id;
}

export async function listContacts(options: {
  limit: number;
}): Promise<ContactSubmission[]> {
  const db = tryGetAdminDb();
  if (!db) {
    return [];
  }
  const snap = await db
    .collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(options.limit)
    .get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name as string,
      email: data.email as string,
      subject: data.subject as string,
      message: data.message as string,
      status: data.status as ContactSubmission["status"],
      createdAt: data.createdAt as string,
    };
  });
}

export async function updateContactStatus(
  id: string,
  status: ContactSubmission["status"],
): Promise<void> {
  const db = tryGetAdminDb();
  if (!db) {
    throw new Error("Database not configured");
  }
  await db.collection(COLLECTION).doc(id).update({ status });
}

export async function countUnreadContacts(): Promise<number> {
  const db = tryGetAdminDb();
  if (!db) {
    return 0;
  }
  const snap = await db
    .collection(COLLECTION)
    .where("status", "==", "new")
    .get();
  return snap.size;
}
