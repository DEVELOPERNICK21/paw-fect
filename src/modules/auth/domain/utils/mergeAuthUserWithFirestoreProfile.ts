import type { User } from '../models/User';

export type FirestoreProfileFields = {
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  onboardingCompleted?: boolean;
  createdAt?: string;
};

/**
 * Merge Auth identity with the Firestore `users/{uid}` profile.
 *
 * Editable profile fields (name, photo, phone) prefer Firestore when set, so a
 * change on one device is not wiped by a stale Auth displayName/photoURL on
 * another device during sign-in / resume refresh.
 */
export function mergeAuthUserWithFirestoreProfile(
  authUser: User,
  firestore: FirestoreProfileFields,
  nowIso: string = new Date().toISOString(),
): User {
  return {
    ...authUser,
    displayName: firestore.displayName ?? authUser.displayName,
    photoURL: firestore.photoURL ?? authUser.photoURL,
    phoneNumber: firestore.phoneNumber ?? authUser.phoneNumber,
    onboardingCompleted:
      firestore.onboardingCompleted ?? authUser.onboardingCompleted,
    createdAt: authUser.createdAt || firestore.createdAt || nowIso,
    lastLoginAt: nowIso,
  };
}
