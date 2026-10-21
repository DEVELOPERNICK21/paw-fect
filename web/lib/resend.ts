import { Resend } from "resend";
import { SUPPORT_EMAIL } from "./support-email";

let client: Resend | null = null;

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return null;
  }
  if (!client) {
    client = new Resend(key);
  }
  return client;
}

export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? "hello@pawsoul.app";
}

/** Inbox that receives contact-form mail. Defaults to the Gmail plus-alias. */
export function getInboxEmail(): string {
  return process.env.CONTACT_INBOX_EMAIL ?? SUPPORT_EMAIL;
}
