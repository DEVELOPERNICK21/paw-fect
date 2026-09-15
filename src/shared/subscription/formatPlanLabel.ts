import type { ComputedEntitlement } from './entitlementEngine';
import { PLAN_CARE_PLUS, PLAN_FAMILY, PLAN_FREE } from './planCatalog';

export function formatPlanDisplayName(plan: ComputedEntitlement['plan']): string {
  switch (plan) {
    case PLAN_CARE_PLUS:
      return 'Care+';
    case PLAN_FAMILY:
      return 'Family';
    case PLAN_FREE:
    default:
      return 'Free';
  }
}

/** Short status line for Settings / paywall (e.g. "Care+ · paid · up to 3 pets"). */
export function formatSubscriptionStatusLine(
  entitlement: ComputedEntitlement,
): string {
  const name = formatPlanDisplayName(entitlement.plan);
  if (entitlement.trialActive) {
    return `${name} · trial · up to ${entitlement.maxPets} pets`;
  }
  if (entitlement.source === 'paid') {
    const grace = entitlement.graceActive ? ' · grace period' : '';
    return `${name} · active${grace} · up to ${entitlement.maxPets} pets`;
  }
  return `${name} · up to ${entitlement.maxPets} pets`;
}
