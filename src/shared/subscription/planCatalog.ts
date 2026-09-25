/**
 * PawCare subscription catalog — source of truth for limits and features.
 * Display/reference INR prices must match App Store India tiers (and Play).
 * Checkout always uses localized store prices via RevenueCat.
 */

export const PLAN_FREE = 'free' as const;
export const PLAN_CARE_PLUS = 'care_plus' as const;
export const PLAN_FAMILY = 'family' as const;

export type PlanKey = typeof PLAN_FREE | typeof PLAN_CARE_PLUS | typeof PLAN_FAMILY;

export interface PlanDefinition {
  readonly key: PlanKey;
  /** Weekly price in INR (₹). Null when the plan has no weekly SKU. */
  readonly priceWeeklyInr: number | null;
  /** Monthly price in INR (₹). */
  readonly priceMonthlyInr: number;
  /** Annual price in INR — App Store India tier (not exact 10× monthly). */
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
    priceWeeklyInr: null,
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
    priceWeeklyInr: 49,
    priceMonthlyInr: 149,
    priceAnnualInr: 1499,
    maxPets: 3,
    historyMonthsCap: null,
    features: {
      // Flags mirror shipped product — not a marketing wishlist.
      pdfExport: false,
      offline: true,
      sharing: false,
      multiUser: false,
      vetPortal: false,
      prioritySupport: false,
    },
  },
  [PLAN_FAMILY]: {
    key: PLAN_FAMILY,
    priceWeeklyInr: null,
    priceMonthlyInr: 299,
    priceAnnualInr: 2999,
    maxPets: 10,
    historyMonthsCap: null,
    features: {
      pdfExport: false,
      offline: true,
      sharing: false,
      multiUser: false,
      vetPortal: false,
      prioritySupport: true,
    },
  },
};

export const TRIAL_DURATION_DAYS = 14;
export const GRACE_PERIOD_AFTER_PAYMENT_FAILURE_DAYS = 7;
