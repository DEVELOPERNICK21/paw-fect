import type { User } from '../models/User';

export type AuthSessionStatus =
  | 'idle'
  | 'restoring'
  | 'authenticated'
  | 'unauthenticated';

export type UserProfileLabels = {
  greetingName: string;
  /** Full display name when present, otherwise a short name derived from email. */
  primaryDisplayName: string;
  initials: string;
  maskedEmail: string;
  memberSinceLine: string | null;
  photoUri: string | null;
  isProfileLoading: boolean;
};

const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain) {
    return email;
  }
  if (local.length <= 1) {
    return `*@${domain}`;
  }
  return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 6))}@${domain}`;
};

const initialsFrom = (displayName: string | null, email: string): string => {
  const trimmed = displayName?.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }
  const local = email.split('@')[0] ?? email;
  return local.slice(0, 2).toUpperCase() || '?';
};

const greetingFrom = (displayName: string | null, email: string): string => {
  const trimmed = displayName?.trim();
  if (trimmed) {
    const first = trimmed.split(/\s+/)[0];
    return first || trimmed;
  }
  const local = email.split('@')[0];
  return local || 'there';
};

const memberSince = (createdAtIso: string): string | null => {
  const d = new Date(createdAtIso);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return `Member since ${d.toLocaleString(undefined, { month: 'short', year: 'numeric' })}`;
};

export class BuildUserProfileLabels {
  execute(
    user: User | null,
    sessionStatus: AuthSessionStatus,
  ): UserProfileLabels {
    const isProfileLoading = sessionStatus === 'restoring' && user === null;

    if (!user) {
      return {
        greetingName: 'there',
        primaryDisplayName: 'Guest',
        initials: '?',
        maskedEmail: '',
        memberSinceLine: null,
        photoUri: null,
        isProfileLoading,
      };
    }

    const greetingName = greetingFrom(user.displayName, user.email);
    return {
      greetingName,
      primaryDisplayName: user.displayName?.trim() || greetingName,
      initials: initialsFrom(user.displayName, user.email),
      maskedEmail: maskEmail(user.email),
      memberSinceLine: memberSince(user.createdAt),
      photoUri: user.photoURL,
      isProfileLoading: false,
    };
  }
}
