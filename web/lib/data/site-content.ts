import { hasUnverifiedClaim } from "@/lib/data/unverified-claims";
import { tryGetAdminDb } from "@/lib/firebase-admin";
import type { SiteContentMarketing } from "@/types";
import { defaultSiteContent } from "@/lib/data/defaults";
import { rebrandSiteContent } from "@/lib/data/rebrandCopy";

const COLLECTION = "site_content";
const DOC_ID = "marketing";

/** Falls back to the code defaults for any stored field that makes a claim we cannot back. */
function withoutUnverifiedClaims(content: SiteContentMarketing): SiteContentMarketing {
  const defaults = defaultSiteContent();
  return {
    ...content,
    heroHeadline: hasUnverifiedClaim(content.heroHeadline) ? defaults.heroHeadline : content.heroHeadline,
    heroSubline: hasUnverifiedClaim(content.heroSubline) ? defaults.heroSubline : content.heroSubline,
    trustBadges: content.trustBadges.some(hasUnverifiedClaim) ? defaults.trustBadges : content.trustBadges,
    pricingFaqs: content.pricingFaqs.filter((f) => !hasUnverifiedClaim(`${f.question} ${f.answer}`)),
  };
}

export async function getSiteContentMarketing(): Promise<SiteContentMarketing> {
  try {
    const db = tryGetAdminDb();
    if (!db) {
      return rebrandSiteContent(defaultSiteContent());
    }
    const ref = db.collection(COLLECTION).doc(DOC_ID);
    const snap = await ref.get();
    if (!snap.exists) {
      return rebrandSiteContent(defaultSiteContent());
    }
    const data = snap.data() as Partial<SiteContentMarketing>;
    return rebrandSiteContent(withoutUnverifiedClaims({ ...defaultSiteContent(), ...data }));
  } catch {
    return rebrandSiteContent(defaultSiteContent());
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
