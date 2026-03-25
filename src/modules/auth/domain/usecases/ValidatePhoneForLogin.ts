/**
 * Basic national / NANP checks for login phone capture (no carrier lookup).
 * Pure domain logic — no I/O.
 */
export type ValidatePhoneForLoginResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

const NANP_LENGTH = 10;

export class ValidatePhoneForLogin {
  execute(
    countryCallingCodeDigits: string,
    nationalDigitsRaw: string,
  ): ValidatePhoneForLoginResult {
    const national = nationalDigitsRaw.replace(/\D/g, '');

    if (national.length === 0) {
      return { ok: false, errorMessage: 'Enter your mobile number.' };
    }

    if (!/^\d+$/.test(national)) {
      return { ok: false, errorMessage: 'Use numbers only.' };
    }

    if (national.startsWith('0')) {
      return {
        ok: false,
        errorMessage: 'Remove the leading 0 from your number.',
      };
    }

    if (countryCallingCodeDigits === '1') {
      if (national.length !== NANP_LENGTH) {
        return {
          ok: false,
          errorMessage: 'Enter a valid 10-digit mobile number.',
        };
      }

      if (national[0] === '0' || national[0] === '1') {
        return { ok: false, errorMessage: 'Invalid area code.' };
      }

      if (national[3] === '0' || national[3] === '1') {
        return { ok: false, errorMessage: 'Invalid phone number.' };
      }

      return { ok: true };
    }

    if (countryCallingCodeDigits === '91') {
      if (national.length !== 10) {
        return {
          ok: false,
          errorMessage: 'Enter a valid 10-digit Indian mobile number.',
        };
      }
      if (!/^[6-9]/.test(national)) {
        return {
          ok: false,
          errorMessage: 'Indian mobile numbers usually start with 6–9.',
        };
      }
      return { ok: true };
    }

    if (national.length < 8 || national.length > 15) {
      return {
        ok: false,
        errorMessage: 'Enter a valid mobile number (8–15 digits).',
      };
    }

    return { ok: true };
  }
}
