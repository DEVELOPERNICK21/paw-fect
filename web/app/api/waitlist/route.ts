import { NextResponse } from "next/server";

import {
  addWaitlistEntry,
  isWaitlistStorageReady,
  WaitlistError,
} from "@/lib/data/waitlist";
import { getFromEmail, getResend } from "@/lib/resend";
import { waitlistSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    available: isWaitlistStorageReady(),
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    const emailError = parsed.error.flatten().fieldErrors.email?.[0];
    return NextResponse.json(
      {
        error: emailError ?? "Please enter a valid email address.",
        code: "VALIDATION",
      },
      { status: 400 },
    );
  }

  try {
    const result = await addWaitlistEntry({
      email: parsed.data.email,
      source: parsed.data.source ?? "web",
    });

    if (result.created) {
      const resend = getResend();
      if (resend) {
        try {
          await resend.emails.send({
            from: getFromEmail(),
            to: parsed.data.email,
            subject: "You're on the Pawfect list",
            text: "Thanks — we'll notify you when the web experience expands.",
          });
        } catch {
          // Confirmation email is optional; Firestore save is the source of truth.
        }
      }
    }

    return NextResponse.json({
      ok: true,
      alreadyRegistered: !result.created,
    });
  } catch (e) {
    if (e instanceof WaitlistError) {
      if (e.code === "NOT_CONFIGURED") {
        return NextResponse.json(
          {
            error:
              "Waitlist sign-ups are not available right now. Please download the app or contact us.",
            code: e.code,
          },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: e.message, code: e.code }, { status: 500 });
    }
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message, code: "UNKNOWN" }, { status: 500 });
  }
}
