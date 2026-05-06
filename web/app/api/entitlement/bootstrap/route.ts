import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-id-token";
import {
  getAdminDb,
  getFirebaseAdminApp,
  hasFirebaseAdminConfig,
} from "@/lib/firebase-admin";
import { writeComputedEntitlement } from "@/lib/subscription/persistEntitlement";
import { parseUserBillingSeed } from "@/lib/subscription/parseUserBilling";
import { TRIAL_DURATION_DAYS } from "@repo-shared/subscription/planCatalog";
import { getAuth } from "firebase-admin/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  if (!hasFirebaseAdminConfig()) {
    return NextResponse.json(
      { error: "Server is not configured for Firebase Admin." },
      { status: 503 },
    );
  }

  const token = getBearerToken(request);
  const verified = await verifyFirebaseIdToken(token);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const ref = db.collection("users").doc(verified.uid);
  const snap = await ref.get();
  const data = snap.data() as Record<string, unknown> | undefined;

  const existingTrial =
    typeof data?.trialEndsAt === "string" ? data.trialEndsAt : null;

  if (!existingTrial) {
    const userRecord = await getAuth(getFirebaseAdminApp()).getUser(
      verified.uid,
    );
    const createdMs = userRecord.metadata.creationTime
      ? Date.parse(userRecord.metadata.creationTime)
      : Date.now();
    const trialEnds = new Date(
      createdMs + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    await ref.set(
      {
        trialEndsAt: trialEnds,
        trialConsumed: false,
        entitlementBootstrapAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  const after = await ref.get();
  const merged = after.data() as Record<string, unknown> | undefined;
  const seed = parseUserBillingSeed(merged);

  const entitlement = await writeComputedEntitlement(db, verified.uid, {
    trialEndsAt: seed.trialEndsAt,
    trialConsumed: seed.trialConsumed,
    subscription: seed.subscription,
  });

  return NextResponse.json({
    entitlement,
  });
}
