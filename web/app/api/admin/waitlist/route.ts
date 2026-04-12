import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import { listWaitlist } from "@/lib/data/waitlist";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response as NextResponse;
  }
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const entries = await listWaitlist({ limit: 200, search: search ?? undefined });
  return NextResponse.json({ entries });
}
