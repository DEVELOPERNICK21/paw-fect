import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;

export function hasFirebaseAdminConfig(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

export function getFirebaseAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY",
    );
  }

  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    adminApp = getApps()[0] as App;
  }
  return adminApp;
}

export function getAdminDb(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}

/** Returns null when Firebase Admin env is not configured (e.g. local build without secrets). */
export function tryGetAdminDb(): Firestore | null {
  if (!hasFirebaseAdminConfig()) {
    return null;
  }
  try {
    return getAdminDb();
  } catch {
    return null;
  }
}
