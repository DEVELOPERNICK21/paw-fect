import { isAuthError } from '../models/AuthError';

export class ResolveAuthErrorMessage {
  execute(error: unknown, fallback: string): string | null {
    if (!isAuthError(error)) {
      return fallback;
    }
    if (error.code === 'cancelled') {
      return null;
    }
    if (error.code === 'network') {
      return 'Network issue detected. Please check connection and retry.';
    }
    if (error.code === 'invalid_credentials') {
      return error.message || 'Invalid email or password.';
    }
    if (error.code === 'rate_limited') {
      return error.message;
    }
    if (error.code === 'account_disabled') {
      return error.message;
    }
    if (error.code === 'requires_recent_login') {
      return error.message;
    }
    return error.message || fallback;
  }
}
