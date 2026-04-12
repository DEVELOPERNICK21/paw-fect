import { tryGetAdminDb } from "@/lib/firebase-admin";
import type { SiteContentMarketing } from "@/types";
import { defaultSiteContent } from "@/lib/data/defaults";

const COLLECTION = "site_content";
const DOC_ID = "marketing";

export async function getSiteContentMarketing(): Promise<SiteContentMarketing> {
  try {
    const db = tryGetAdminDb();
    if (!db) {
      return defaultSiteContent();
    }
    const ref = db.collection(COLLECTION).doc(DOC_ID);
    const snap = await ref.get();
    if (!snap.exists) {
      return defaultSiteContent();
    }
    const data = snap.data() as Partial<SiteContentMarketing>;
    return { ...defaultSiteContent(), ...data };
  } catch {
    return defaultSiteContent();
  }
}

export async function saveSiteContentMarketing(
  content: SiteContentMarketing,
): Promise<void> {
  const db = tryGetAdminDb();
  if (!db) {
    throw new Error("Database not configured");
  }
  await db
    .collection(COLLECTION)
    .doc(DOC_ID)
    .set(
      {
        ...content,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
}
