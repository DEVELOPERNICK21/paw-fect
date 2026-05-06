import { PLAN_CARE_PLUS, PLAN_FAMILY } from "@repo-shared/subscription/planCatalog";

export type PurchasablePlanKey = typeof PLAN_CARE_PLUS | typeof PLAN_FAMILY;

/**
 * Maps Razorpay dashboard plan_id strings to our plan keys. Env must list every plan used in checkout.
 */
export function resolvePlanKeyFromRazorpayPlanId(
  planId: string | undefined,
): PurchasablePlanKey | null {
  if (!planId) {
    return null;
  }
  const care = new Set(
    [
      process.env.RAZORPAY_PLAN_CARE_PLUS_MONTHLY,
      process.env.RAZORPAY_PLAN_CARE_PLUS_YEARLY,
    ].filter(Boolean) as string[],
  );
  const family = new Set(
    [
      process.env.RAZORPAY_PLAN_FAMILY_MONTHLY,
      process.env.RAZORPAY_PLAN_FAMILY_YEARLY,
    ].filter(Boolean) as string[],
  );
  if (care.has(planId)) {
    return PLAN_CARE_PLUS;
  }
  if (family.has(planId)) {
    return PLAN_FAMILY;
  }
  return null;
}

export function razorpayPlanIdFor(
  planKey: PurchasablePlanKey,
  billing: "monthly" | "annual",
): string | null {
  const env =
    planKey === PLAN_FAMILY
      ? billing === "annual"
        ? process.env.RAZORPAY_PLAN_FAMILY_YEARLY
        : process.env.RAZORPAY_PLAN_FAMILY_MONTHLY
      : billing === "annual"
        ? process.env.RAZORPAY_PLAN_CARE_PLUS_YEARLY
        : process.env.RAZORPAY_PLAN_CARE_PLUS_MONTHLY;
  return env?.trim() || null;
}
