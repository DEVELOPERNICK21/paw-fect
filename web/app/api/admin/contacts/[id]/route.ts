import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import { updateContactStatus } from "@/lib/data/contacts";
import type { ContactSubmission } from "@/types";

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
  const status = (body as { status?: ContactSubmission["status"] }).status;
  if (!status || !["new", "read", "replied"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  try {
    await updateContactStatus(params.id, status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
