import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import { getAllPricingPlans, createPricingPlan } from "@/lib/data/pricing";
import { pricingPlanWriteSchema } from "@/lib/schemas";
import type { PricingPlan } from "@/types";

export async function GET(): Promise<NextResponse> {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response as NextResponse;
  }
  const plans = await getAllPricingPlans();
  return NextResponse.json({ plans });
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response as NextResponse;
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = pricingPlanWriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const data = parsed.data;
  const payload: Omit<PricingPlan, "id" | "createdAt" | "updatedAt"> = {
    name: data.name,
    slug: data.slug,
    priceMonthly: data.priceMonthly,
    priceAnnual: data.priceAnnual,
    currency: data.currency,
    maxPets: data.maxPets,
    isPopular: data.isPopular,
    isActive: data.isActive,
    badgeText: data.badgeText,
    ctaLabel: data.ctaLabel,
    features: data.features,
  };
  try {
    const id = await createPricingPlan(payload);
    return NextResponse.json({ id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
