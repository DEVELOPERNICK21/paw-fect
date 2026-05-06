import { PLAN_CARE_PLUS, PLAN_FAMILY } from './planCatalog';

export interface PlayStorePlanConfig {
  planKey: typeof PLAN_CARE_PLUS | typeof PLAN_FAMILY;
  billingPeriod: 'monthly' | 'annual';
  productId: string;
}

// Replace these IDs with your Play Console subscription product IDs.
export const PLAY_STORE_PLANS: readonly PlayStorePlanConfig[] = [
  {
    planKey: PLAN_CARE_PLUS,
    billingPeriod: 'monthly',
    productId: 'care_plus_monthly',
  },
  {
    planKey: PLAN_CARE_PLUS,
    billingPeriod: 'annual',
    productId: 'care_plus_annual',
  },
  {
    planKey: PLAN_FAMILY,
    billingPeriod: 'monthly',
    productId: 'family_monthly',
  },
  {
    planKey: PLAN_FAMILY,
    billingPeriod: 'annual',
    productId: 'family_annual',
  },
] as const;

export function playProductIdFor(
  planKey: typeof PLAN_CARE_PLUS | typeof PLAN_FAMILY,
  billingPeriod: 'monthly' | 'annual',
): string | null {
  return (
    PLAY_STORE_PLANS.find(
      p => p.planKey === planKey && p.billingPeriod === billingPeriod,
    )?.productId ?? null
  );
}
