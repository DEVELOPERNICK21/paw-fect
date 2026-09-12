import {
  GRACE_PERIOD_AFTER_PAYMENT_FAILURE_DAYS,
  PLAN_CARE_PLUS,
  PLAN_FAMILY,
} from "@repo-shared/subscription/planCatalog";
import type { StoredSubscriptionState } from "@repo-shared/subscription/entitlementEngine";
import { mapStoreProductIdToPlan } from "./mapStoreProductIdToPlan";

export interface RevenueCatEventPayload {
  readonly type: string;
  readonly app_user_id: string;
  readonly product_id: string;
  readonly expiration_at_ms: number | null;
  readonly entitlement_ids?: readonly string[];
  readonly event_timestamp_ms?: number;
}

export interface RevenueCatWebhookBody {
  readonly api_version?: string;
  readonly event: RevenueCatEventPayload;
}

const ACTIVE_EVENT_TYPES = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
]);

function toIsoFromMillis(ms: number | null | undefined): string | null {
  if (ms == null || Number.isNaN(ms)) {
    return null;
  }
  return new Date(ms).toISOString();
}

function resolvePlan(
  productId: string,
  entitlementIds: readonly string[] | undefined,
): Pick<StoredSubscriptionState, "planKey" | "billingPeriod"> | null {
  const fromProduct = mapStoreProductIdToPlan(productId);
  if (fromProduct) {
    return fromProduct;
  }

  const ids = entitlementIds ?? [];
  if (ids.includes(PLAN_FAMILY)) {
    return { planKey: PLAN_FAMILY, billingPeriod: "monthly" };
  }
  if (ids.includes(PLAN_CARE_PLUS)) {
    return { planKey: PLAN_CARE_PLUS, billingPeriod: "monthly" };
  }
  return null;
}

function resolveStatus(
  eventType: string,
  expirationAtMs: number | null | undefined,
  eventTimestampMs: number | undefined,
): Pick<StoredSubscriptionState, "status" | "gracePeriodEndsAt"> | null {
  if (ACTIVE_EVENT_TYPES.has(eventType)) {
    return { status: "active", gracePeriodEndsAt: null };
  }

  if (eventType === "BILLING_ISSUE") {
    const eventTime = eventTimestampMs ?? Date.now();
    const graceEnds = new Date(
      eventTime +
        GRACE_PERIOD_AFTER_PAYMENT_FAILURE_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    return { status: "past_due", gracePeriodEndsAt: graceEnds };
  }

  if (eventType === "CANCELLATION") {
    const now = Date.now();
    if (expirationAtMs != null && expirationAtMs > now) {
      return { status: "active", gracePeriodEndsAt: null };
    }
    return { status: "cancelled", gracePeriodEndsAt: null };
  }

  if (eventType === "EXPIRATION") {
    return { status: "cancelled", gracePeriodEndsAt: null };
  }

  return null;
}

export function isRevenueCatWebhookAuthorized(
  authHeader: string | null,
  secret: string,
): boolean {
  if (!authHeader || !secret) {
    return false;
  }
  const prefix = "Bearer ";
  if (!authHeader.startsWith(prefix)) {
    return false;
  }
  return authHeader.slice(prefix.length) === secret;
}

export function mapRevenueCatEventToSubscription(
  event: RevenueCatEventPayload,
): StoredSubscriptionState | null {
  const plan = resolvePlan(event.product_id, event.entitlement_ids);
  if (!plan) {
    return null;
  }

  const statusResult = resolveStatus(
    event.type,
    event.expiration_at_ms,
    event.event_timestamp_ms,
  );
  if (!statusResult) {
    return null;
  }

  const { status, gracePeriodEndsAt } = statusResult;

  return {
    provider: "revenuecat",
    revenueCatProductId: event.product_id,
    planKey: plan.planKey,
    billingPeriod: plan.billingPeriod,
    status,
    currentPeriodEnd: toIsoFromMillis(event.expiration_at_ms),
    gracePeriodEndsAt,
  };
}
