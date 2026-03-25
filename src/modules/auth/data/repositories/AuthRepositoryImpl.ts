import type { User } from '../../domain/models/User';
import { isAuthError } from '../../domain/models/AuthError';
import { normalizeStoredUser } from '../../domain/models/normalizeStoredUser';
import type { AuthRepository } from '../../domain/repositories/AuthRepository';
import type { AuthRemoteDataSource } from '../datasources/AuthRemoteDataSource';
import { createAuthRemoteDataSource } from '../datasources/AuthRemoteDataSource';
import type { AuthLocalDataSource } from '../datasources/AuthLocalDataSource';
import { createAuthLocalDataSource } from '../datasources/AuthLocalDataSource';
import type { UserProfileRemoteDataSource } from '../datasources/UserProfileRemoteDataSource';
import { createUserProfileRemoteDataSource } from '../datasources/UserProfileRemoteDataSource';
import type { PasswordResetQueueEntry } from '../datasources/AuthLocalDataSource';

interface AuthSessionPayload {
  user: User;
  token: string;
}

export class AuthRepositoryImpl implements AuthRepository {
  private static readonly MAX_RESET_QUEUE_ATTEMPTS = 10;
  private static readonly RESET_BACKOFF_BASE_MS = 5_000; // 5s, exponential
  private static readonly RESET_BACKOFF_MAX_MS = 15 * 60 * 1000; // 15m

  constructor(
    private readonly remote: AuthRemoteDataSource,
    private readonly local: AuthLocalDataSource,
    private readonly profile: UserProfileRemoteDataSource,
  ) {}

  private async persistSession(payload: AuthSessionPayload): Promise<User> {
    let user = payload.user;
    try {
      user = await this.profile.syncOnSignIn(payload.user);
    } catch {
      // Offline, rules mismatch, or Firestore unavailable — keep auth-shaped user.
    }
    await this.local.setToken(payload.token);
    await this.local.setUser(user);
    return user;
  }

  async login(email: string, password: string): Promise<User> {
    const response = await this.remote.login(email, password);
    return this.persistSession(response);
  }

  async signup(email: string, password: string): Promise<User> {
    const response = await this.remote.signup(email, password);
    return this.persistSession(response);
  }

  async loginWithGoogle(): Promise<User> {
    const response = await this.remote.loginWithGoogle();
    return this.persistSession(response);
  }

  async requestOtp(phoneE164: string): Promise<string> {
    const { verificationId } = await this.remote.requestOtp(phoneE164);
    await this.local.setPendingPhone(phoneE164);
    await this.local.setPendingVerificationId(verificationId);
    return verificationId;
  }

  async verifyOtp(verificationId: string, otpCode: string): Promise<User> {
    const response = await this.remote.verifyOtp(verificationId, otpCode);
    const user = await this.persistSession(response);
    await this.local.clearPendingVerificationId();
    await this.local.clearPendingPhone();
    return user;
  }

  async resendOtp(phoneE164: string): Promise<string> {
    const { verificationId } = await this.remote.resendOtp(phoneE164);
    await this.local.setPendingPhone(phoneE164);
    await this.local.setPendingVerificationId(verificationId);
    return verificationId;
  }

  async logout(): Promise<void> {
    const token = await this.local.getToken();
    try {
      await this.remote.logout(token);
    } catch {
      // Remote clears Firebase in `finally`; local must still be wiped.
    }

    await this.local.clearToken();
    await this.local.clearUser();
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await this.remote.sendPasswordResetEmail(email);
    } catch (error) {
      // Offline-first: if Firebase is unreachable, optimistically enqueue and return success.
      if (isAuthError(error) && error.code === 'network') {
        await this.enqueuePasswordResetEmail(email);
        return;
      }
      throw error;
    }
  }

  private async enqueuePasswordResetEmail(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const queue = await this.local.getPendingPasswordResets();
    const alreadyQueued = queue.some(entry => entry.email === normalized);
    if (alreadyQueued) {
      return;
    }

    const now = new Date().toISOString();
    const entry: PasswordResetQueueEntry = {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      email: normalized,
      createdAt: now,
      attempts: 0,
      lastAttemptAt: null,
    };
    await this.local.setPendingPasswordResets([...queue, entry]);
  }

  private computeResetRetryDelayMs(attempts: number): number {
    const delayMs = AuthRepositoryImpl.RESET_BACKOFF_BASE_MS * 2 ** attempts;
    return Math.min(AuthRepositoryImpl.RESET_BACKOFF_MAX_MS, delayMs);
  }

  async processPasswordResetQueue(): Promise<void> {
    const queue = await this.local.getPendingPasswordResets();
    if (queue.length === 0) {
      return;
    }

    const nowMs = Date.now();
    const remaining: PasswordResetQueueEntry[] = [];

    for (const entry of queue) {
      if (entry.attempts >= AuthRepositoryImpl.MAX_RESET_QUEUE_ATTEMPTS) {
        continue;
      }

      const lastAttemptMs = entry.lastAttemptAt
        ? new Date(entry.lastAttemptAt).getTime()
        : null;

      const retryDelayMs = this.computeResetRetryDelayMs(entry.attempts);
      const eligible =
        lastAttemptMs == null || nowMs - lastAttemptMs >= retryDelayMs;

      if (!eligible) {
        remaining.push(entry);
        continue;
      }

      try {
        await this.remote.sendPasswordResetEmail(entry.email);
        // Success: drop from queue.
      } catch (error) {
        const lastAttemptAt = new Date().toISOString();
        // Keep retrying for network/rate-limits and unknown transient errors.
        if (
          isAuthError(error) &&
          (error.code === 'network' || error.code === 'rate_limited' || error.code === 'unknown')
        ) {
          remaining.push({
            ...entry,
            attempts: entry.attempts + 1,
            lastAttemptAt,
          });
          continue;
        }

        // Non-retryable / unexpected: still increment attempts to avoid infinite loops.
        remaining.push({
          ...entry,
          attempts: entry.attempts + 1,
          lastAttemptAt,
        });
      }
    }

    await this.local.setPendingPasswordResets(remaining);
  }

  subscribeSession(onChange: (user: User | null) => void): () => void {
    return this.remote.watchAuthChanges(async session => {
      if (!session) {
        await this.local.clearToken();
        await this.local.clearUser();
        onChange(null);
        return;
      }
      const user = await this.persistSession(session);
      onChange(user);
    });
  }

  async refreshProfileFromRemoteSession(): Promise<User | null> {
    try {
      const session = await this.remote.getCurrentSession();
      if (!session) {
        return null;
      }
      return this.persistSession(session);
    } catch {
      const localUser = await this.local.getUser();
      const token = await this.local.getToken();
      if (localUser && token) {
        return localUser;
      }
      return null;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const session = await this.remote.getCurrentSession();
      if (session) {
        return this.persistSession(session);
      }
    } catch {
      // Token refresh / bridge issues — fall through to local.
    }

    const localUser = await this.local.getUser();
    const token = await this.local.getToken();
    if (localUser && token) {
      return localUser;
    }
    if (!token) {
      return null;
    }

    let remoteUser: User | null = null;
    try {
      const raw = await this.remote.getCurrentUser(token);
      remoteUser = normalizeStoredUser(raw);
    } catch {
      remoteUser = null;
    }
    if (remoteUser) {
      await this.local.setUser(remoteUser);
    }

    return remoteUser;
  }
}

export const createAuthRepository = (): AuthRepository => {
  const remote = createAuthRemoteDataSource();
  const local = createAuthLocalDataSource();
  const profile = createUserProfileRemoteDataSource();
  return new AuthRepositoryImpl(remote, local, profile);
};
