import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import { seedDefaultPricingPlans } from "@/lib/data/seed-pricing";

export async function POST(): Promise<NextResponse> {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response as NextResponse;
  }
  try {
    const created = await seedDefaultPricingPlans();
    return NextResponse.json({ created });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
