import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb, hasFirebaseAdminConfig } from "@/lib/firebase-admin";
import { writeComputedEntitlement } from "@/lib/subscription/persistEntitlement";
import { parseUserBillingSeed } from "@/lib/subscription/parseUserBilling";
import {
  isRevenueCatWebhookAuthorized,
  mapRevenueCatEventToSubscription,
  type RevenueCatWebhookBody,
} from "@/lib/subscription/revenueCatWebhook";

export async function POST(request: Request): Promise<NextResponse> {
  if (!hasFirebaseAdminConfig()) {
    return NextResponse.json({ error: "Firebase Admin not configured." }, { status: 503 });
  }

  const secret = process.env.REVENUECAT_WEBHOOK_SECRET?.trim() ?? "";
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (!isRevenueCatWebhookAuthorized(auth, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RevenueCatWebhookBody;
  try {
    body = (await request.json()) as RevenueCatWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.event;
  if (!event?.app_user_id || !event.type) {
    return NextResponse.json({ error: "Missing event" }, { status: 400 });
  }

  const uid = event.app_user_id.trim();
  if (!uid || uid.startsWith("$RCAnonymousID:")) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const subscription = mapRevenueCatEventToSubscription(event);
  if (!subscription) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  // Merge-write even if the user doc is not bootstrapped yet (same as Razorpay).
  // 404 would drop a paid event because RC typically does not retry 404s.
  const userData = userSnap.data() as Record<string, unknown> | undefined;
  const paidLike =
    subscription.status === "active" ||
    subscription.status === "authenticated" ||
    subscription.status === "past_due";

  await userRef.set(
    {
      subscription,
      ...(paidLike ? { trialConsumed: true } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const seed = parseUserBillingSeed({
    ...userData,
    subscription,
    trialConsumed: paidLike ? true : userData?.trialConsumed === true,
  });
  await writeComputedEntitlement(db, uid, seed);
  return NextResponse.json({ ok: true });
}
