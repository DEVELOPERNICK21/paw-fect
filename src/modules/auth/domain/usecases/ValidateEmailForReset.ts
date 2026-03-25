export type ValidateEmailForResetResult =
  | { ok: true; normalizedEmail: string }
  | { ok: false; errorMessage: string };

export class ValidateEmailForReset {
  execute(emailRaw: string): ValidateEmailForResetResult {
    const normalizedEmail = emailRaw.trim().toLowerCase();
    if (!normalizedEmail) {
      return { ok: false, errorMessage: 'Enter the email for your account.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { ok: false, errorMessage: 'Enter a valid email address.' };
    }
    return { ok: true, normalizedEmail };
  }
}
