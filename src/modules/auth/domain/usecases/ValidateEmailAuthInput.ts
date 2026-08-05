export type ValidateEmailAuthInputResult =
  | { ok: true; normalizedEmail: string }
  | { ok: false; errorMessage: string };

export class ValidateEmailAuthInput {
  execute(emailRaw: string, password: string): ValidateEmailAuthInputResult {
    const normalizedEmail = emailRaw.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return { ok: false, errorMessage: 'Email and password are required.' };
    }
    // Limit email to a maximum of 254 characters to prevent ReDoS / Resource Exhaustion
    if (normalizedEmail.length > 254) {
      return { ok: false, errorMessage: 'Email address is too long.' };
    }
    // Limit password to a maximum of 128 characters to prevent CPU-intensive hashing DoS
    if (password.length > 128) {
      return { ok: false, errorMessage: 'Password must be no more than 128 characters.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { ok: false, errorMessage: 'Enter a valid email address.' };
    }
    if (password.length < 6) {
      return { ok: false, errorMessage: 'Password must be at least 6 characters.' };
    }
    return { ok: true, normalizedEmail };
  }
}
