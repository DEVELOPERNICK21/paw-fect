import type { StoredSubscriptionStatus } from "@repo-shared/subscription/entitlementEngine";

export function mapRazorpaySubscriptionStatus(
  status: string | undefined,
): StoredSubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "authenticated":
      return "authenticated";
    case "pending":
      return "authenticated";
    case "created":
      return "authenticated";
    case "halted":
      return "halted";
    case "paused":
      return "paused";
    case "cancelled":
      return "cancelled";
    case "completed":
      return "completed";
    default:
      return "none";
  }
}
