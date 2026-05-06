import { PLAN_CARE_PLUS, PLAN_FAMILY } from "@repo-shared/subscription/planCatalog";
import type { StoredSubscriptionState } from "@repo-shared/subscription/entitlementEngine";

export function mapGoogleProductIdToPlan(
  productId: string,
): Pick<StoredSubscriptionState, "planKey" | "billingPeriod"> | null {
  const careMonthly = process.env.PLAY_SUB_CARE_PLUS_MONTHLY?.trim();
  const careAnnual = process.env.PLAY_SUB_CARE_PLUS_ANNUAL?.trim();
  const familyMonthly = process.env.PLAY_SUB_FAMILY_MONTHLY?.trim();
  const familyAnnual = process.env.PLAY_SUB_FAMILY_ANNUAL?.trim();

  if (productId === careMonthly) {
    return { planKey: PLAN_CARE_PLUS, billingPeriod: "monthly" };
  }
  if (productId === careAnnual) {
    return { planKey: PLAN_CARE_PLUS, billingPeriod: "annual" };
  }
  if (productId === familyMonthly) {
    return { planKey: PLAN_FAMILY, billingPeriod: "monthly" };
  }
  if (productId === familyAnnual) {
    return { planKey: PLAN_FAMILY, billingPeriod: "annual" };
  }
  return null;
}
