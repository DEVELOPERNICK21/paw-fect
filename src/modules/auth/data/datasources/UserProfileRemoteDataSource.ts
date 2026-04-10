import firestore from '@react-native-firebase/firestore';

import type { User } from '../../domain/models/User';

/**
 * Firestore profile documents: `users/{uid}`.
 *
 * Security rules (assumption for production): only the signed-in user may read/write their own doc, e.g.
 * `match /users/{userId} { allow read, write: if request.auth != null && request.auth.uid == userId; }`
 *
 * Client merges auth-derived fields with stored profile on each sign-in; failures are non-fatal (offline-first).
 */
export interface UserProfileRemoteDataSource {
  syncOnSignIn(user: User): Promise<User>;
  updateProfile(
    userId: string,
    input: { displayName: string; phoneNumber: string | null },
  ): Promise<User>;
}

class UserProfileRemoteDataSourceImpl implements UserProfileRemoteDataSource {
  async syncOnSignIn(user: User): Promise<User> {
    const ref = firestore().collection('users').doc(user.id);
    const snap = await ref.get();
    const data = snap.data() as Record<string, unknown> | undefined;

    const docDisplayName =
      typeof data?.displayName === 'string' ? data.displayName : null;
    const docPhoto = typeof data?.photoURL === 'string' ? data.photoURL : null;
    const docPhone = typeof data?.phoneNumber === 'string' ? data.phoneNumber : null;
    const docOnboarding =
      typeof data?.onboardingCompleted === 'boolean'
        ? data.onboardingCompleted
        : undefined;
    const docCreated =
      typeof data?.createdAt === 'string' ? data.createdAt : undefined;

    const nowIso = new Date().toISOString();
    const merged: User = {
      ...user,
      displayName: user.displayName ?? docDisplayName,
      photoURL: user.photoURL ?? docPhoto,
      phoneNumber: user.phoneNumber ?? docPhone,
      onboardingCompleted: docOnboarding ?? user.onboardingCompleted,
      createdAt: user.createdAt || docCreated || nowIso,
      lastLoginAt: nowIso,
    };

    await ref.set(
      {
        email: merged.email,
        displayName: merged.displayName,
        photoURL: merged.photoURL,
        phoneNumber: merged.phoneNumber,
        onboardingCompleted: merged.onboardingCompleted,
        createdAt: merged.createdAt,
        lastLoginAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return merged;
  }

  async updateProfile(
    userId: string,
    input: { displayName: string; phoneNumber: string | null },
  ): Promise<User> {
    const ref = firestore().collection('users').doc(userId);
    const nowIso = new Date().toISOString();
    await ref.set(
      {
        displayName: input.displayName,
        phoneNumber: input.phoneNumber,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    const snap = await ref.get();
    const data = snap.data() as Record<string, unknown> | undefined;
    return {
      id: userId,
      email: typeof data?.email === 'string' ? data.email : '',
      displayName: typeof data?.displayName === 'string' ? data.displayName : null,
      photoURL: typeof data?.photoURL === 'string' ? data.photoURL : null,
      phoneNumber: typeof data?.phoneNumber === 'string' ? data.phoneNumber : null,
      createdAt: typeof data?.createdAt === 'string' ? data.createdAt : nowIso,
      lastLoginAt:
        typeof data?.lastLoginAt === 'string' ? data.lastLoginAt : nowIso,
      onboardingCompleted:
        typeof data?.onboardingCompleted === 'boolean'
          ? data.onboardingCompleted
          : false,
    };
  }
}

export const createUserProfileRemoteDataSource =
  (): UserProfileRemoteDataSource => new UserProfileRemoteDataSourceImpl();
