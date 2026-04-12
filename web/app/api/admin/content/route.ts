import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import { getSiteContentMarketing, saveSiteContentMarketing } from "@/lib/data/site-content";
import type { SiteContentMarketing } from "@/types";

export async function GET(): Promise<NextResponse> {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response as NextResponse;
  }
  const content = await getSiteContentMarketing();
  return NextResponse.json({ content });
}

export async function PATCH(request: Request): Promise<NextResponse> {
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
  const content = body as SiteContentMarketing;
  if (!content?.heroHeadline || !content.heroSubline) {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }
  try {
    await saveSiteContentMarketing(content);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
