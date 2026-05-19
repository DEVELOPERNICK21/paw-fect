import { isWaitlistStorageReady } from "@/lib/data/waitlist";
import { hasFirebaseAdminConfig } from "@/lib/firebase-admin";

export default function AdminSettingsPage(): React.ReactElement {
  const firebaseConfigured = hasFirebaseAdminConfig();
  const waitlistReady = isWaitlistStorageReady();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Settings</h1>
      <p className="mt-4 text-stone-600 dark:text-stone-400">
        Configure environment variables for Firebase Admin, NextAuth, and Resend. See{" "}
        <code className="rounded bg-stone-200 px-1 dark:bg-stone-800">web/.env.example</code>.
      </p>

      <div className="mt-8 rounded-xl border border-stone-200 p-4 dark:border-stone-700">
        <p className="text-sm font-medium text-stone-900 dark:text-stone-50">Service status</p>
        <ul className="mt-3 space-y-2 text-sm text-stone-600 dark:text-stone-400">
          <li>
            Firebase Admin:{" "}
            <span
              className={
                firebaseConfigured
                  ? "font-medium text-emerald-700 dark:text-emerald-400"
                  : "font-medium text-red-600 dark:text-red-400"
              }
            >
              {firebaseConfigured ? "configured" : "missing env vars"}
            </span>
          </li>
          <li>
            Website waitlist:{" "}
            <span
              className={
                waitlistReady
                  ? "font-medium text-emerald-700 dark:text-emerald-400"
                  : "font-medium text-red-600 dark:text-red-400"
              }
            >
              {waitlistReady ? "ready" : "not available (needs Firebase Admin)"}
            </span>
          </li>
        </ul>
      </div>

      <ul className="mt-6 list-inside list-disc text-sm text-stone-600 dark:text-stone-400">
        <li>FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY</li>
        <li>NEXTAUTH_SECRET, NEXTAUTH_URL, ADMIN_EMAIL, ADMIN_PASSWORD_HASH</li>
        <li>RESEND_API_KEY, RESEND_FROM_EMAIL (optional — confirmation emails)</li>
        <li>NEXT_PUBLIC_SITE_URL</li>
      </ul>
    </div>
  );
}
