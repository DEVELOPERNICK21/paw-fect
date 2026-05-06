import {
  PLAN_CARE_PLUS,
  PLAN_FAMILY,
} from "@repo-shared/subscription/planCatalog";
import type {
  StoredSubscriptionState,
  StoredSubscriptionStatus,
} from "@repo-shared/subscription/entitlementEngine";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function parseStoredSubscription(
  raw: unknown,
): StoredSubscriptionState | null {
  if (!isRecord(raw)) {
    return null;
  }
  const provider = raw.provider;
  if (provider !== "razorpay" && provider !== "google_play") {
    return null;
  }
  const planKey = raw.planKey;
  if (planKey !== PLAN_CARE_PLUS && planKey !== PLAN_FAMILY) {
    return null;
  }
  const billingPeriod = raw.billingPeriod;
  if (billingPeriod !== "monthly" && billingPeriod !== "annual") {
    return null;
  }
  const status = raw.status;
  const allowed: StoredSubscriptionStatus[] = [
    "none",
    "active",
    "authenticated",
    "past_due",
    "paused",
    "cancelled",
    "completed",
    "halted",
  ];
  if (typeof status !== "string" || !allowed.includes(status as StoredSubscriptionStatus)) {
    return null;
  }
  const razorpaySubscriptionId =
    typeof raw.razorpaySubscriptionId === "string"
      ? raw.razorpaySubscriptionId
      : null;
  const googlePurchaseToken =
    typeof raw.googlePurchaseToken === "string"
      ? raw.googlePurchaseToken
      : null;
  const googleProductId =
    typeof raw.googleProductId === "string" ? raw.googleProductId : null;

  return {
    provider,
    razorpaySubscriptionId,
    googlePurchaseToken,
    googleProductId,
    planKey,
    billingPeriod,
    status: status as StoredSubscriptionStatus,
    currentPeriodEnd:
      typeof raw.currentPeriodEnd === "string" ? raw.currentPeriodEnd : null,
    gracePeriodEndsAt:
      typeof raw.gracePeriodEndsAt === "string"
        ? raw.gracePeriodEndsAt
        : null,
  };
}

export interface UserBillingSeed {
  trialEndsAt: string | null;
  trialConsumed: boolean;
  subscription: StoredSubscriptionState | null;
}

export function parseUserBillingSeed(data: Record<string, unknown> | undefined): UserBillingSeed {
  if (!data) {
    return { trialEndsAt: null, trialConsumed: false, subscription: null };
  }
  return {
    trialEndsAt:
      typeof data.trialEndsAt === "string" ? data.trialEndsAt : null,
    trialConsumed: data.trialConsumed === true,
    subscription: parseStoredSubscription(data.subscription),
  };
}
