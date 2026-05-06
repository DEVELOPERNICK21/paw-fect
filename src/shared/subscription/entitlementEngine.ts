import {
  PLAN_CARE_PLUS,
  PLAN_CATALOG,
  PLAN_FAMILY,
  PLAN_FREE,
  type PlanKey,
} from './planCatalog';

export type SubscriptionBillingPeriod = 'monthly' | 'annual';

/** Normalized subscription lifecycle for entitlement checks. */
export type StoredSubscriptionStatus =
  | 'none'
  | 'active'
  | 'authenticated'
  | 'past_due'
  | 'paused'
  | 'cancelled'
  | 'completed'
  | 'halted';

export interface StoredSubscriptionState {
  readonly provider: 'razorpay' | 'google_play';
  readonly razorpaySubscriptionId?: string | null;
  readonly googlePurchaseToken?: string | null;
  readonly googleProductId?: string | null;
  readonly planKey: typeof PLAN_CARE_PLUS | typeof PLAN_FAMILY;
  readonly billingPeriod: SubscriptionBillingPeriod;
  readonly status: StoredSubscriptionStatus;
  /** ISO — end of current paid period when known. */
  readonly currentPeriodEnd: string | null;
  /** ISO — while past_due, access continues until this instant. */
  readonly gracePeriodEndsAt: string | null;
}

export type EntitlementSource = 'paid' | 'trial' | 'free';

export interface ComputedEntitlement {
  readonly plan: PlanKey;
  readonly source: EntitlementSource;
  readonly maxPets: number;
  readonly historyMonthsCap: number | null;
  readonly pdfExport: boolean;
  readonly offline: boolean;
  readonly sharing: boolean;
  readonly multiUser: boolean;
  readonly vetPortal: boolean;
  readonly prioritySupport: boolean;
  readonly trialActive: boolean;
  readonly trialEndsAt: string | null;
  readonly trialConsumed: boolean;
  readonly graceActive: boolean;
  readonly gracePeriodEndsAt: string | null;
  readonly computedAt: string;
}

function featuresForPlan(plan: PlanKey) {
  return PLAN_CATALOG[plan].features;
}

function capsForPlan(plan: PlanKey): {
  maxPets: number;
  historyMonthsCap: number | null;
} {
  const def = PLAN_CATALOG[plan];
  return {
    maxPets: def.maxPets,
    historyMonthsCap: def.historyMonthsCap,
  };
}

function isPaidAccessAllowed(
  now: Date,
  subscription: StoredSubscriptionState | null,
): boolean {
  if (!subscription || subscription.status === 'none') {
    return false;
  }
  const { status, gracePeriodEndsAt, currentPeriodEnd } = subscription;

  if (status === 'active' || status === 'authenticated') {
    return true;
  }

  if (status === 'past_due' && gracePeriodEndsAt) {
    return new Date(gracePeriodEndsAt).getTime() > now.getTime();
  }

  if (status === 'paused' && currentPeriodEnd) {
    return new Date(currentPeriodEnd).getTime() > now.getTime();
  }

  return false;
}

function effectivePaidPlanKey(
  subscription: StoredSubscriptionState | null,
): typeof PLAN_CARE_PLUS | typeof PLAN_FAMILY {
  if (!subscription) {
    return PLAN_CARE_PLUS;
  }
  return subscription.planKey === PLAN_FAMILY ? PLAN_FAMILY : PLAN_CARE_PLUS;
}

export interface ComputeEntitlementInput {
  readonly now: Date;
  readonly trialEndsAt: string | null;
  readonly trialConsumed: boolean;
  readonly subscription: StoredSubscriptionState | null;
}

export function computeEntitlement(input: ComputeEntitlementInput): ComputedEntitlement {
  const { now, trialEndsAt, trialConsumed, subscription } = input;
  const computedAt = now.toISOString();

  const trialEndDate =
    trialEndsAt && trialEndsAt.length > 0 ? new Date(trialEndsAt) : null;
  const trialStillValid =
    !trialConsumed &&
    trialEndDate !== null &&
    !Number.isNaN(trialEndDate.getTime()) &&
    trialEndDate.getTime() > now.getTime();

  const paidOk = isPaidAccessAllowed(now, subscription);
  const graceActive =
    Boolean(subscription?.gracePeriodEndsAt) &&
    subscription?.status === 'past_due' &&
    paidOk;

  if (paidOk && subscription) {
    const pk = effectivePaidPlanKey(subscription);
    const caps = capsForPlan(pk);
    const f = featuresForPlan(pk);
    return {
      plan: pk,
      source: 'paid',
      maxPets: caps.maxPets,
      historyMonthsCap: caps.historyMonthsCap,
      pdfExport: f.pdfExport,
      offline: f.offline,
      sharing: f.sharing,
      multiUser: f.multiUser,
      vetPortal: f.vetPortal,
      prioritySupport: f.prioritySupport,
      trialActive: false,
      trialEndsAt,
      trialConsumed,
      graceActive,
      gracePeriodEndsAt: subscription.gracePeriodEndsAt,
      computedAt,
    };
  }

  if (trialStillValid) {
    const caps = capsForPlan(PLAN_CARE_PLUS);
    const f = featuresForPlan(PLAN_CARE_PLUS);
    return {
      plan: PLAN_CARE_PLUS,
      source: 'trial',
      maxPets: caps.maxPets,
      historyMonthsCap: caps.historyMonthsCap,
      pdfExport: f.pdfExport,
      offline: f.offline,
      sharing: f.sharing,
      multiUser: f.multiUser,
      vetPortal: f.vetPortal,
      prioritySupport: f.prioritySupport,
      trialActive: true,
      trialEndsAt,
      trialConsumed,
      graceActive: false,
      gracePeriodEndsAt: null,
      computedAt,
    };
  }

  const caps = capsForPlan(PLAN_FREE);
  const f = featuresForPlan(PLAN_FREE);
  return {
    plan: PLAN_FREE,
    source: 'free',
    maxPets: caps.maxPets,
    historyMonthsCap: caps.historyMonthsCap,
    pdfExport: f.pdfExport,
    offline: f.offline,
    sharing: f.sharing,
    multiUser: f.multiUser,
    vetPortal: f.vetPortal,
    prioritySupport: f.prioritySupport,
    trialActive: false,
    trialEndsAt,
    trialConsumed,
    graceActive: false,
    gracePeriodEndsAt: subscription?.gracePeriodEndsAt ?? null,
    computedAt,
  };
}

export function historyCutoffIso(entitlement: ComputedEntitlement, now: Date): string | null {
  const cap = entitlement.historyMonthsCap;
  if (cap === null) {
    return null;
  }
  const d = new Date(now);
  d.setMonth(d.getMonth() - cap);
  return d.toISOString();
}
