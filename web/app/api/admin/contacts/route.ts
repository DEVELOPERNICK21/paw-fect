import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import { listContacts } from "@/lib/data/contacts";

export async function GET(): Promise<NextResponse> {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response as NextResponse;
  }
  const contacts = await listContacts({ limit: 200 });
  return NextResponse.json({ contacts });
}
