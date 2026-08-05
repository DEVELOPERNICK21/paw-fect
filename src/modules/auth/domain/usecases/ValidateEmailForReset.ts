export type ValidateEmailForResetResult =
  | { ok: true; normalizedEmail: string }
  | { ok: false; errorMessage: string };

export class ValidateEmailForReset {
  execute(emailRaw: string): ValidateEmailForResetResult {
    const normalizedEmail = emailRaw.trim().toLowerCase();
    if (!normalizedEmail) {
      return { ok: false, errorMessage: 'Enter the email for your account.' };
    }
    // Limit email to a maximum of 254 characters to prevent ReDoS / Resource Exhaustion
    if (normalizedEmail.length > 254) {
      return { ok: false, errorMessage: 'Email address is too long.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { ok: false, errorMessage: 'Enter a valid email address.' };
    }
    return { ok: true, normalizedEmail };
  }
}
