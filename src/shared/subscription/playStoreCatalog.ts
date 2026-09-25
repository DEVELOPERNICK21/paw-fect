import { PLAN_CARE_PLUS, PLAN_FAMILY } from './planCatalog';

export type StoreBillingPeriod = 'weekly' | 'monthly' | 'annual';

export interface PlayStorePlanConfig {
  planKey: typeof PLAN_CARE_PLUS | typeof PLAN_FAMILY;
  billingPeriod: StoreBillingPeriod;
  productId: string;
}

// Keep in sync with Play Console / App Store / RevenueCat product IDs.
export const PLAY_STORE_PLANS: readonly PlayStorePlanConfig[] = [
  {
    planKey: PLAN_CARE_PLUS,
    billingPeriod: 'weekly',
    productId: 'care_plus_weekly',
  },
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
  billingPeriod: StoreBillingPeriod,
): string | null {
  return (
    PLAY_STORE_PLANS.find(
      p => p.planKey === planKey && p.billingPeriod === billingPeriod,
    )?.productId ?? null
  );
}
