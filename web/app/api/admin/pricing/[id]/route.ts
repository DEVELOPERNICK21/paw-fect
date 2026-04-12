import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import { updatePricingPlan, softDeletePricingPlan } from "@/lib/data/pricing";
import { pricingPlanWriteSchema } from "@/lib/schemas";
import type { PricingPlan } from "@/types";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
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
  const payload: Partial<Omit<PricingPlan, "id" | "createdAt">> = {
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
    await updatePricingPlan(params.id, payload);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response as NextResponse;
  }
  try {
    await softDeletePricingPlan(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
