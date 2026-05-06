import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import Razorpay from "razorpay";
import type { Subscriptions } from "razorpay/dist/types/subscriptions";

import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-id-token";
import {
  getAdminDb,
  hasFirebaseAdminConfig,
} from "@/lib/firebase-admin";
import {
  razorpayPlanIdFor,
  type PurchasablePlanKey,
} from "@/lib/subscription/planIdMap";
import { PLAN_CARE_PLUS, PLAN_FAMILY } from "@repo-shared/subscription/planCatalog";
export const dynamic = "force-dynamic";

const TOTAL_BILLING_CYCLES = 240;

interface CreateBody {
  planKey?: string;
  billingPeriod?: "monthly" | "annual";
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!hasFirebaseAdminConfig()) {
    return NextResponse.json(
      { error: "Server is not configured for Firebase Admin." },
      { status: 503 },
    );
  }

  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Razorpay keys are not configured." },
      { status: 503 },
    );
  }

  const token = getBearerToken(request);
  const verified = await verifyFirebaseIdToken(token);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const planKey =
    body.planKey === PLAN_FAMILY ? PLAN_FAMILY : PLAN_CARE_PLUS;
  const billingPeriod = body.billingPeriod === "annual" ? "annual" : "monthly";

  const planId = razorpayPlanIdFor(planKey as PurchasablePlanKey, billingPeriod);
  if (!planId) {
    return NextResponse.json(
      { error: "Missing Razorpay plan id for this tier and billing period." },
      { status: 503 },
    );
  }

  const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });

  const db = getAdminDb();
  const userRef = db.collection("users").doc(verified.uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data() as Record<string, unknown> | undefined;

  let customerId =
    typeof userData?.razorpayCustomerId === "string"
      ? userData.razorpayCustomerId
      : null;

  if (!customerId) {
    const email = verified.email ?? `${verified.uid}@pawfect.app`;
    const customer = await rzp.customers.create({
      email,
      fail_existing: 0,
      notes: { firebase_uid: verified.uid },
    });
    customerId = customer.id;
    await userRef.set(
      {
        razorpayCustomerId: customerId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  type CreateWithCustomer =
    Subscriptions.RazorpaySubscriptionCreateRequestBody & {
      customer_id: string;
    };

  const subscriptionParams: CreateWithCustomer = {
    plan_id: planId,
    customer_id: customerId,
    customer_notify: 1,
    total_count: TOTAL_BILLING_CYCLES,
    notes: { firebase_uid: verified.uid, plan_key: planKey },
  };

  const subscription = await rzp.subscriptions.create(
    subscriptionParams as unknown as Subscriptions.RazorpaySubscriptionCreateRequestBody,
  );

  await db.collection("razorpaySubscriptionIndex").doc(subscription.id).set({
    uid: verified.uid,
    planKey,
    billingPeriod,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({
    keyId,
    subscriptionId: subscription.id,
    planKey,
    billingPeriod,
  });
}
