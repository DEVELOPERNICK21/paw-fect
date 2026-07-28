import { NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/schemas";
import { createContactSubmission } from "@/lib/data/contacts";
import { getResend, getFromEmail } from "@/lib/resend";

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  try {
    await createContactSubmission(parsed.data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({
        from: getFromEmail(),
        to: process.env.CONTACT_INBOX_EMAIL ?? getFromEmail(),
        subject: `[Pawsoul] ${parsed.data.subject}`,
        text: `From: ${parsed.data.name} <${parsed.data.email}>\n\n${parsed.data.message}`,
      });
    } catch {
      // Email failure should not block success if Firestore saved
    }
  }

  return NextResponse.json({ ok: true });
}
