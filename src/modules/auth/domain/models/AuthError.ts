export type AuthErrorCode =
  | 'cancelled'
  | 'network'
  | 'configuration'
  | 'invalid_credentials'
  | 'rate_limited'
  | 'account_disabled'
  | 'requires_recent_login'
  | 'unknown';

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export const isAuthError = (value: unknown): value is AuthError =>
  value instanceof AuthError;
