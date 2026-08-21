import type { User } from '../../models/User';
import { mergeAuthUserWithFirestoreProfile } from '../mergeAuthUserWithFirestoreProfile';

const authUser = (overrides: Partial<User> = {}): User => ({
  id: 'uid-1',
  email: 'ada@example.com',
  displayName: 'Google Ada',
  photoURL: 'https://lh3.googleusercontent.com/old',
  phoneNumber: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  lastLoginAt: '2026-01-01T00:00:00.000Z',
  onboardingCompleted: false,
  ...overrides,
});

describe('mergeAuthUserWithFirestoreProfile', () => {
  it('prefers Firestore displayName over Auth so edits sync across devices', () => {
    const merged = mergeAuthUserWithFirestoreProfile(
      authUser(),
      {
        displayName: 'Custom Ada',
        photoURL: null,
        phoneNumber: '+15551212',
      },
      '2026-08-12T00:00:00.000Z',
    );

    expect(merged.displayName).toBe('Custom Ada');
    expect(merged.phoneNumber).toBe('+15551212');
    // Auth photo still used when Firestore has none
    expect(merged.photoURL).toBe('https://lh3.googleusercontent.com/old');
  });

  it('uses Auth fields when Firestore profile fields are empty (first sign-in)', () => {
    const merged = mergeAuthUserWithFirestoreProfile(
      authUser({ displayName: 'Fresh Google' }),
      {
        displayName: null,
        photoURL: null,
        phoneNumber: null,
      },
      '2026-08-12T00:00:00.000Z',
    );

    expect(merged.displayName).toBe('Fresh Google');
  });

  it('prefers Firestore photoURL when present', () => {
    const merged = mergeAuthUserWithFirestoreProfile(
      authUser(),
      {
        displayName: null,
        photoURL: 'data:image/jpeg;base64,NEW',
        phoneNumber: null,
      },
      '2026-08-12T00:00:00.000Z',
    );

    expect(merged.photoURL).toBe('data:image/jpeg;base64,NEW');
  });
});
