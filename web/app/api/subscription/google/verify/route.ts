import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-id-token";
import { getAdminDb, hasFirebaseAdminConfig } from "@/lib/firebase-admin";
import { getGooglePlayAccessToken } from "@/lib/subscription/googlePlayAuth";
import { mapGoogleProductIdToPlan } from "@/lib/subscription/googlePlayPlanMap";
import { writeComputedEntitlement } from "@/lib/subscription/persistEntitlement";
import { parseUserBillingSeed } from "@/lib/subscription/parseUserBilling";
import type { StoredSubscriptionState } from "@repo-shared/subscription/entitlementEngine";

interface VerifyBody {
  purchaseToken?: string;
  productId?: string;
}

interface GoogleSubscriptionPurchase {
  expiryTimeMillis?: string;
  paymentState?: number;
  autoRenewing?: boolean;
  cancelReason?: number;
}

function toIsoFromMillis(ms: string | undefined): string | null {
  if (!ms) return null;
  const n = Number(ms);
  if (Number.isNaN(n)) return null;
  return new Date(n).toISOString();
}

function statusFromGooglePurchase(
  purchase: GoogleSubscriptionPurchase,
): StoredSubscriptionState["status"] {
  if (purchase.cancelReason != null) {
    return "cancelled";
  }
  if (purchase.paymentState === 0) {
    return "authenticated";
  }
  if (purchase.paymentState === 1) {
    return "active";
  }
  if (purchase.paymentState === 3) {
    return "past_due";
  }
  return "active";
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!hasFirebaseAdminConfig()) {
    return NextResponse.json({ error: "Firebase Admin not configured." }, { status: 503 });
  }

  const token = getBearerToken(request);
  const verified = await verifyFirebaseIdToken(token);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: VerifyBody;
  try {
    body = (await request.json()) as VerifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const purchaseToken = body.purchaseToken?.trim();
  const productId = body.productId?.trim();
  if (!purchaseToken || !productId) {
    return NextResponse.json(
      { error: "purchaseToken and productId are required." },
      { status: 400 },
    );
  }

  const planInfo = mapGoogleProductIdToPlan(productId);
  if (!planInfo) {
    return NextResponse.json(
      { error: "Unknown Play product. Map it in env first." },
      { status: 400 },
    );
  }

  const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim();
  if (!packageName) {
    return NextResponse.json({ error: "Missing GOOGLE_PLAY_PACKAGE_NAME." }, { status: 503 });
  }

  const accessToken = await getGooglePlayAccessToken();
  const verifyUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(
    packageName,
  )}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(
    purchaseToken,
  )}`;

  const gpRes = await fetch(verifyUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const gpJson = (await gpRes.json()) as GoogleSubscriptionPurchase & {
    error?: { message?: string };
  };
  if (!gpRes.ok) {
    return NextResponse.json(
      { error: gpJson.error?.message ?? "Google Play verification failed." },
      { status: 400 },
    );
  }

  const status = statusFromGooglePurchase(gpJson);
  const currentPeriodEnd = toIsoFromMillis(gpJson.expiryTimeMillis);
  const subscription: StoredSubscriptionState = {
    provider: "google_play",
    googlePurchaseToken: purchaseToken,
    googleProductId: productId,
    planKey: planInfo.planKey,
    billingPeriod: planInfo.billingPeriod,
    status,
    currentPeriodEnd,
    gracePeriodEndsAt: null,
  };

  const db = getAdminDb();
  const userRef = db.collection("users").doc(verified.uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data() as Record<string, unknown> | undefined;
  await userRef.set(
    {
      subscription,
      trialConsumed: true,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const seed = parseUserBillingSeed({
    ...userData,
    subscription,
    trialConsumed: true,
  });
  const entitlement = await writeComputedEntitlement(db, verified.uid, seed);
  return NextResponse.json({ entitlement });
}
