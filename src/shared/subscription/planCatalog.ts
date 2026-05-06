/**
 * PawCare subscription catalog — source of truth for limits and features.
 * Mirrors business rules; keep in sync with web marketing defaults and Razorpay plan mapping.
 */

export const PLAN_FREE = 'free' as const;
export const PLAN_CARE_PLUS = 'care_plus' as const;
export const PLAN_FAMILY = 'family' as const;

export type PlanKey = typeof PLAN_FREE | typeof PLAN_CARE_PLUS | typeof PLAN_FAMILY;

export interface PlanDefinition {
  readonly key: PlanKey;
  /** Monthly price in INR (₹). */
  readonly priceMonthlyInr: number;
  /** Annual price in INR — 10× monthly (two months free). */
  readonly priceAnnualInr: number;
  readonly maxPets: number;
  /** Number of months of history on free; null = unlimited. */
  readonly historyMonthsCap: number | null;
  readonly features: {
    readonly pdfExport: boolean;
    readonly offline: boolean;
    readonly sharing: boolean;
    readonly multiUser: boolean;
    readonly vetPortal: boolean;
    readonly prioritySupport: boolean;
  };
}

export const PLAN_CATALOG: Record<PlanKey, PlanDefinition> = {
  [PLAN_FREE]: {
    key: PLAN_FREE,
    priceMonthlyInr: 0,
    priceAnnualInr: 0,
    maxPets: 1,
    historyMonthsCap: 3,
    features: {
      pdfExport: false,
      offline: false,
      sharing: false,
      multiUser: false,
      vetPortal: false,
      prioritySupport: false,
    },
  },
  [PLAN_CARE_PLUS]: {
    key: PLAN_CARE_PLUS,
    priceMonthlyInr: 149,
    priceAnnualInr: 1490,
    maxPets: 3,
    historyMonthsCap: null,
    features: {
      pdfExport: true,
      offline: true,
      sharing: true,
      multiUser: false,
      vetPortal: false,
      prioritySupport: false,
    },
  },
  [PLAN_FAMILY]: {
    key: PLAN_FAMILY,
    priceMonthlyInr: 299,
    priceAnnualInr: 2990,
    maxPets: 10,
    historyMonthsCap: null,
    features: {
      pdfExport: true,
      offline: true,
      sharing: true,
      multiUser: true,
      vetPortal: true,
      prioritySupport: true,
    },
  },
};

export const TRIAL_DURATION_DAYS = 14;
export const GRACE_PERIOD_AFTER_PAYMENT_FAILURE_DAYS = 7;
