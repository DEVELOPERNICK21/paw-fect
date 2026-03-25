import type { User } from './User';

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

/**
 * Upgrades persisted or API-shaped user JSON to the canonical {@link User} shape.
 */
export function normalizeStoredUser(raw: unknown): User | null {
  if (!isRecord(raw)) {
    return null;
  }
  const id = raw.id;
  const email = raw.email;
  if (typeof id !== 'string' || typeof email !== 'string') {
    return null;
  }

  const createdAt =
    typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString();
  const lastLoginAt =
    typeof raw.lastLoginAt === 'string' ? raw.lastLoginAt : createdAt;

  return {
    id,
    email,
    displayName: typeof raw.displayName === 'string' ? raw.displayName : null,
    photoURL: typeof raw.photoURL === 'string' ? raw.photoURL : null,
    phoneNumber: typeof raw.phoneNumber === 'string' ? raw.phoneNumber : null,
    createdAt,
    lastLoginAt,
    onboardingCompleted: Boolean(raw.onboardingCompleted),
  };
}
