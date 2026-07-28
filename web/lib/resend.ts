import { Resend } from "resend";

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
