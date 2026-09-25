import {
  PLAN_CARE_PLUS,
  PLAN_FAMILY,
} from "@repo-shared/subscription/planCatalog";
import type { StoredSubscriptionState } from "@repo-shared/subscription/entitlementEngine";

function matchesProductId(productId: string, expected: string): boolean {
  return productId === expected || productId.startsWith(`${expected}:`);
}

/**
 * Maps a Play / App Store product id to planKey + billingPeriod.
 * Env overrides optional; defaults match shipped product ids.
 * Play base-plan ids (`productId:basePlanId`) are accepted.
 */
export function mapStoreProductIdToPlan(
  productId: string,
): Pick<StoredSubscriptionState, "planKey" | "billingPeriod"> | null {
  const careWeekly =
    process.env.PLAY_SUB_CARE_PLUS_WEEKLY?.trim() || "care_plus_weekly";
  const careMonthly =
    process.env.PLAY_SUB_CARE_PLUS_MONTHLY?.trim() || "care_plus_monthly";
  const careAnnual =
    process.env.PLAY_SUB_CARE_PLUS_ANNUAL?.trim() || "care_plus_annual";
  const familyMonthly =
    process.env.PLAY_SUB_FAMILY_MONTHLY?.trim() || "family_monthly";
  const familyAnnual =
    process.env.PLAY_SUB_FAMILY_ANNUAL?.trim() || "family_annual";

  if (matchesProductId(productId, careWeekly)) {
    return { planKey: PLAN_CARE_PLUS, billingPeriod: "weekly" };
  }
  if (matchesProductId(productId, careMonthly)) {
    return { planKey: PLAN_CARE_PLUS, billingPeriod: "monthly" };
  }
  if (matchesProductId(productId, careAnnual)) {
    return { planKey: PLAN_CARE_PLUS, billingPeriod: "annual" };
  }
  if (matchesProductId(productId, familyMonthly)) {
    return { planKey: PLAN_FAMILY, billingPeriod: "monthly" };
  }
  if (matchesProductId(productId, familyAnnual)) {
    return { planKey: PLAN_FAMILY, billingPeriod: "annual" };
  }
  return null;
}
