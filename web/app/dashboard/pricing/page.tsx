import { PricingAdmin } from "@/components/admin/PricingAdmin";
import { getAllPricingPlans } from "@/lib/data/pricing";

export default async function AdminPricingPage(): Promise<React.ReactElement> {
  const plans = await getAllPricingPlans();
  return <PricingAdmin initialPlans={plans} />;
}
