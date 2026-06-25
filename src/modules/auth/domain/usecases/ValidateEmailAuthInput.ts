export type ValidateEmailAuthInputResult =
  | { ok: true; normalizedEmail: string }
  | { ok: false; errorMessage: string };

export class ValidateEmailAuthInput {
  execute(emailRaw: string, password: string): ValidateEmailAuthInputResult {
    const normalizedEmail = emailRaw.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return { ok: false, errorMessage: 'Email and password are required.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { ok: false, errorMessage: 'Enter a valid email address.' };
    }
    if (password.length < 8) {
      return { ok: false, errorMessage: 'Password must be at least 8 characters.' };
    }
    return { ok: true, normalizedEmail };
  }
}
