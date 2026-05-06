import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb, hasFirebaseAdminConfig } from "@/lib/firebase-admin";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay/verifyWebhookSignature";
import {
  resolvePlanKeyFromRazorpayPlanId,
  razorpayPlanIdFor,
} from "@/lib/subscription/planIdMap";
import { writeComputedEntitlement } from "@/lib/subscription/persistEntitlement";
import { parseUserBillingSeed } from "@/lib/subscription/parseUserBilling";
import { mapRazorpaySubscriptionStatus } from "@/lib/subscription/mapRazorpayStatus";
import {
  GRACE_PERIOD_AFTER_PAYMENT_FAILURE_DAYS,
  PLAN_CARE_PLUS,
  PLAN_FAMILY,
} from "@repo-shared/subscription/planCatalog";
import type { StoredSubscriptionState } from "@repo-shared/subscription/entitlementEngine";
import type { Firestore } from "firebase-admin/firestore";
import type { PurchasablePlanKey } from "@/lib/subscription/planIdMap";

export const dynamic = "force-dynamic";

function unixSecToIso(sec: unknown): string | null {
  if (typeof sec !== "number" || Number.isNaN(sec)) {
    return null;
  }
  return new Date(sec * 1000).toISOString();
}

function inferBillingPeriod(
  planId: string | undefined,
  planKey: PurchasablePlanKey,
): "monthly" | "annual" {
  const monthly = razorpayPlanIdFor(planKey, "monthly");
  const annual = razorpayPlanIdFor(planKey, "annual");
  if (planId && annual && planId === annual) {
    return "annual";
  }
  if (planId && monthly && planId === monthly) {
    return "monthly";
  }
  return "monthly";
}

async function resolveFirebaseUid(
  db: Firestore,
  subscriptionId: string | undefined,
  notes: Record<string, unknown> | undefined,
): Promise<string | null> {
  const fromNotes =
    typeof notes?.firebase_uid === "string" ? notes.firebase_uid : null;
  if (fromNotes) {
    return fromNotes;
  }
  if (!subscriptionId) {
    return null;
  }
  const idx = await db.collection("razorpaySubscriptionIndex").doc(subscriptionId).get();
  const d = idx.data();
  return typeof d?.uid === "string" ? d.uid : null;
}

function buildStateFromEntity(
  entity: Record<string, unknown>,
): StoredSubscriptionState | null {
  const id = typeof entity.id === "string" ? entity.id : null;
  const planId = typeof entity.plan_id === "string" ? entity.plan_id : undefined;
  const pk = resolvePlanKeyFromRazorpayPlanId(planId) ?? PLAN_CARE_PLUS;
  const planKey = pk === PLAN_FAMILY ? PLAN_FAMILY : PLAN_CARE_PLUS;
  const billingPeriod = inferBillingPeriod(planId, planKey);
  const rawStatus = typeof entity.status === "string" ? entity.status : "";
  const status = mapRazorpaySubscriptionStatus(rawStatus);
  const currentEnd =
    unixSecToIso(entity.current_end) ??
    unixSecToIso(entity.charge_at) ??
    null;

  return {
    provider: "razorpay",
    razorpaySubscriptionId: id,
    planKey,
    billingPeriod,
    status,
    currentPeriodEnd: currentEnd,
    gracePeriodEndsAt: null,
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!hasFirebaseAdminConfig()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get("x-razorpay-signature");
  if (!verifyRazorpayWebhookSignature(rawBody, sig, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let parsed: { event?: string; payload?: Record<string, unknown> };
  try {
    parsed = JSON.parse(rawBody) as {
      event?: string;
      payload?: Record<string, unknown>;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = parsed.event ?? "";
  const db = getAdminDb();

  const log = async (uid: string | null, note: string, extra?: Record<string, unknown>): Promise<void> => {
    await db.collection("subscription_webhook_events").add({
      createdAt: FieldValue.serverTimestamp(),
      event,
      uid,
      note,
      ...extra,
    });
  };

  try {
    if (event.startsWith("subscription.")) {
      const subWrap = parsed.payload?.subscription as
        | { entity?: Record<string, unknown> }
        | undefined;
      const entity = subWrap?.entity;
      if (!entity) {
        await log(null, "missing_subscription_entity");
        return NextResponse.json({ received: true });
      }
      const notes = entity.notes as Record<string, unknown> | undefined;
      const uid = await resolveFirebaseUid(
        db,
        typeof entity.id === "string" ? entity.id : undefined,
        notes,
      );
      if (!uid) {
        await log(null, "uid_unresolved", { subscriptionId: entity.id });
        return NextResponse.json({ received: true });
      }

      let nextState: StoredSubscriptionState | null = buildStateFromEntity(entity);

      if (event === "subscription.cancelled" || event === "subscription.completed") {
        nextState = nextState
          ? {
              ...nextState,
              status:
                event === "subscription.completed" ? "completed" : "cancelled",
              gracePeriodEndsAt: null,
            }
          : null;
      }

      if (event === "subscription.paused") {
        nextState = nextState
          ? { ...nextState, status: "paused" }
          : null;
      }

      if (event === "subscription.charged" || event === "subscription.activated") {
        nextState = nextState
          ? {
              ...nextState,
              status: "active",
              gracePeriodEndsAt: null,
            }
          : null;
      }

      if (!nextState) {
        await log(uid, "could_not_build_state");
        return NextResponse.json({ received: true });
      }

      const userRef = db.collection("users").doc(uid);
      const userSnap = await userRef.get();
      const userData = userSnap.data() as Record<string, unknown> | undefined;

      await userRef.set(
        {
          subscription: nextState,
          trialConsumed: true,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      const seed = parseUserBillingSeed({
        ...userData,
        ...{ subscription: nextState, trialConsumed: true },
      });
      await writeComputedEntitlement(db, uid, seed);
      await log(uid, "subscription_event_applied", {
        subscriptionId: nextState.razorpaySubscriptionId,
      });
      return NextResponse.json({ received: true });
    }

    if (event === "payment.failed") {
      const payWrap = parsed.payload?.payment as
        | { entity?: Record<string, unknown> }
        | undefined;
      const payment = payWrap?.entity;
      const subscriptionId =
        typeof payment?.subscription_id === "string"
          ? payment.subscription_id
          : null;
      if (!subscriptionId) {
        await log(null, "payment_failed_no_subscription");
        return NextResponse.json({ received: true });
      }

      const idx = await db
        .collection("razorpaySubscriptionIndex")
        .doc(subscriptionId)
        .get();
      const uid = typeof idx.data()?.uid === "string" ? idx.data()?.uid : null;
      if (!uid) {
        await log(null, "payment_failed_uid_missing", { subscriptionId });
        return NextResponse.json({ received: true });
      }

      const userRef = db.collection("users").doc(uid);
      const userSnap = await userRef.get();
      const userData = userSnap.data() as Record<string, unknown> | undefined;
      const prev = parseUserBillingSeed(userData).subscription;

      const graceEnds = new Date(
        Date.now() +
          GRACE_PERIOD_AFTER_PAYMENT_FAILURE_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();

      const nextState: StoredSubscriptionState =
        prev && prev.provider === "razorpay"
          ? {
              ...prev,
              status: "past_due",
              gracePeriodEndsAt: graceEnds,
            }
          : {
              provider: "razorpay",
              razorpaySubscriptionId: subscriptionId,
              planKey: PLAN_CARE_PLUS,
              billingPeriod: "monthly",
              status: "past_due",
              currentPeriodEnd: null,
              gracePeriodEndsAt: graceEnds,
            };

      await userRef.set(
        {
          subscription: nextState,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      const seed = parseUserBillingSeed({
        ...userData,
        subscription: nextState,
      });
      await writeComputedEntitlement(db, uid, seed);
      await log(uid, "payment_failed_grace", { subscriptionId });
      return NextResponse.json({ received: true });
    }

    await log(null, "ignored_event");
    return NextResponse.json({ received: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "error";
    await db.collection("subscription_webhook_events").add({
      createdAt: FieldValue.serverTimestamp(),
      event,
      uid: null,
      note: "handler_error",
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
