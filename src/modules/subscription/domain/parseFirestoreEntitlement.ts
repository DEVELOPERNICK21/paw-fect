import {
  PLAN_CARE_PLUS,
  PLAN_FAMILY,
  PLAN_FREE,
  type PlanKey,
} from '../../../shared/subscription/planCatalog';
import type { ComputedEntitlement } from '../../../shared/subscription/entitlementEngine';

function isPlanKey(v: unknown): v is PlanKey {
  return v === PLAN_FREE || v === PLAN_CARE_PLUS || v === PLAN_FAMILY;
}

function isSource(v: unknown): v is ComputedEntitlement['source'] {
  return v === 'paid' || v === 'trial' || v === 'free';
}

export function parseFirestoreEntitlement(
  raw: unknown,
): ComputedEntitlement | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const o = raw as Record<string, unknown>;
  if (!isPlanKey(o.plan) || !isSource(o.source)) {
    return null;
  }
  if (typeof o.maxPets !== 'number' || o.maxPets < 1) {
    return null;
  }
  const historyMonthsCap =
    o.historyMonthsCap === null || typeof o.historyMonthsCap === 'number'
      ? (o.historyMonthsCap as number | null)
      : null;

  return {
    plan: o.plan,
    source: o.source,
    maxPets: o.maxPets,
    historyMonthsCap,
    pdfExport: o.pdfExport === true,
    offline: o.offline === true,
    sharing: o.sharing === true,
    multiUser: o.multiUser === true,
    vetPortal: o.vetPortal === true,
    prioritySupport: o.prioritySupport === true,
    trialActive: o.trialActive === true,
    trialEndsAt: typeof o.trialEndsAt === 'string' ? o.trialEndsAt : null,
    trialConsumed: o.trialConsumed === true,
    graceActive: o.graceActive === true,
    gracePeriodEndsAt:
      typeof o.gracePeriodEndsAt === 'string' ? o.gracePeriodEndsAt : null,
    computedAt: typeof o.computedAt === 'string' ? o.computedAt : new Date().toISOString(),
  };
}
