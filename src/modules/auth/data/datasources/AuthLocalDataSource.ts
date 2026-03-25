import type { User } from '../../domain/models/User';
import { normalizeStoredUser } from '../../domain/models/normalizeStoredUser';
import { storageService } from '../../../../infrastructure/storage/storageService';

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';
const AUTH_PENDING_PHONE_KEY = 'authPendingPhone';
const AUTH_PENDING_VERIFICATION_ID_KEY = 'authPendingVerificationId';
const AUTH_PENDING_PASSWORD_RESETS_KEY = 'authPendingPasswordResets';

export type PasswordResetQueueEntry = {
  id: string;
  email: string;
  createdAt: string;
  attempts: number;
  lastAttemptAt: string | null;
};

export interface AuthLocalDataSource {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  clearToken(): Promise<void>;
  getUser(): Promise<User | null>;
  setUser(user: User): Promise<void>;
  clearUser(): Promise<void>;
  setPendingPhone(phoneE164: string): Promise<void>;
  getPendingPhone(): Promise<string | null>;
  clearPendingPhone(): Promise<void>;
  setPendingVerificationId(verificationId: string): Promise<void>;
  getPendingVerificationId(): Promise<string | null>;
  clearPendingVerificationId(): Promise<void>;

  getPendingPasswordResets(): Promise<PasswordResetQueueEntry[]>;
  setPendingPasswordResets(entries: PasswordResetQueueEntry[]): Promise<void>;
}

class AuthLocalDataSourceImpl implements AuthLocalDataSource {
  async getToken(): Promise<string | null> {
    const token = await storageService.getItem<string | null>(AUTH_TOKEN_KEY);
    return token ?? null;
  }

  async setToken(token: string): Promise<void> {
    await storageService.setItem(AUTH_TOKEN_KEY, token);
  }

  async clearToken(): Promise<void> {
    await storageService.removeItem(AUTH_TOKEN_KEY);
  }

  async getUser(): Promise<User | null> {
    const raw = await storageService.getItem<unknown>(AUTH_USER_KEY);
    return normalizeStoredUser(raw);
  }

  async setUser(user: User): Promise<void> {
    await storageService.setItem(AUTH_USER_KEY, user);
  }

  async clearUser(): Promise<void> {
    await storageService.removeItem(AUTH_USER_KEY);
  }

  async setPendingPhone(phoneE164: string): Promise<void> {
    await storageService.setItem(AUTH_PENDING_PHONE_KEY, phoneE164);
  }

  async getPendingPhone(): Promise<string | null> {
    const phone = await storageService.getItem<string | null>(AUTH_PENDING_PHONE_KEY);
    return phone ?? null;
  }

  async clearPendingPhone(): Promise<void> {
    await storageService.removeItem(AUTH_PENDING_PHONE_KEY);
  }

  async setPendingVerificationId(verificationId: string): Promise<void> {
    await storageService.setItem(AUTH_PENDING_VERIFICATION_ID_KEY, verificationId);
  }

  async getPendingVerificationId(): Promise<string | null> {
    const verificationId = await storageService.getItem<string | null>(
      AUTH_PENDING_VERIFICATION_ID_KEY,
    );
    return verificationId ?? null;
  }

  async clearPendingVerificationId(): Promise<void> {
    await storageService.removeItem(AUTH_PENDING_VERIFICATION_ID_KEY);
  }

  async getPendingPasswordResets(): Promise<PasswordResetQueueEntry[]> {
    const raw = await storageService.getItem<unknown>(
      AUTH_PENDING_PASSWORD_RESETS_KEY,
    );
    if (!Array.isArray(raw)) {
      return [];
    }

    const out: PasswordResetQueueEntry[] = [];
    for (const item of raw) {
      if (!item || typeof item !== 'object') {
        continue;
      }

      const o = item as Record<string, unknown>;
      const id = o.id;
      const email = o.email;
      const createdAt = o.createdAt;
      const attempts = o.attempts;
      const lastAttemptAt = o.lastAttemptAt;

      if (typeof id !== 'string' || typeof email !== 'string' || typeof createdAt !== 'string') {
        continue;
      }
      if (typeof attempts !== 'number') {
        continue;
      }
      if (lastAttemptAt !== null && typeof lastAttemptAt !== 'string') {
        continue;
      }

      out.push({
        id,
        email,
        createdAt,
        attempts,
        lastAttemptAt: lastAttemptAt ?? null,
      });
    }
    return out;
  }

  async setPendingPasswordResets(
    entries: PasswordResetQueueEntry[],
  ): Promise<void> {
    await storageService.setItem(AUTH_PENDING_PASSWORD_RESETS_KEY, entries);
  }
}

export const createAuthLocalDataSource = (): AuthLocalDataSource =>
  new AuthLocalDataSourceImpl();

