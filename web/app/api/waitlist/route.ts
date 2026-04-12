import { NextResponse } from "next/server";
import { waitlistSchema } from "@/lib/schemas";
import { addWaitlistEntry } from "@/lib/data/waitlist";
import { getResend, getFromEmail } from "@/lib/resend";

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  try {
    await addWaitlistEntry({
      email: parsed.data.email,
      source: parsed.data.source ?? "web",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({
        from: getFromEmail(),
        to: parsed.data.email,
        subject: "You’re on the Pawfect list",
        text: "Thanks — we’ll notify you when the web experience expands.",
      });
    } catch {
      // optional
    }
  }

  return NextResponse.json({ ok: true });
}
