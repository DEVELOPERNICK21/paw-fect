export type AuthErrorCode =
  | 'cancelled'
  | 'network'
  | 'configuration'
  | 'invalid_credentials'
  | 'rate_limited'
  | 'account_disabled'
  | 'requires_recent_login'
  | 'unknown';

/** Same symbol across Metro bundles — use with `isAuthError` when `instanceof` fails. */
export const AUTH_ERROR_BRAND = Symbol.for('pawfect.AuthError');

export class AuthError extends Error {
  readonly [AUTH_ERROR_BRAND] = true;

  constructor(
    public readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export const isAuthError = (value: unknown): value is AuthError => {
  if (value instanceof AuthError) {
    return true;
  }
  if (!value || typeof value !== 'object') {
    return false;
  }
  return AUTH_ERROR_BRAND in value && 'code' in value && typeof (value as AuthError).code === 'string';
};
