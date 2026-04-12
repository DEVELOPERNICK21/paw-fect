import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import { deleteWaitlistEntry } from "@/lib/data/waitlist";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response as NextResponse;
  }
  try {
    await deleteWaitlistEntry(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
