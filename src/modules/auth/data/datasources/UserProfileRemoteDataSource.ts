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
}

export const createUserProfileRemoteDataSource =
  (): UserProfileRemoteDataSource => new UserProfileRemoteDataSourceImpl();
