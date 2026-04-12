export default function AdminSettingsPage(): React.ReactElement {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Settings</h1>
      <p className="mt-4 text-stone-600 dark:text-stone-400">
        Configure environment variables for Firebase Admin, NextAuth, and Resend. See{" "}
        <code className="rounded bg-stone-200 px-1 dark:bg-stone-800">web/.env.example</code>.
      </p>
      <ul className="mt-6 list-inside list-disc text-sm text-stone-600 dark:text-stone-400">
        <li>FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY</li>
        <li>NEXTAUTH_SECRET, NEXTAUTH_URL, ADMIN_EMAIL, ADMIN_PASSWORD_HASH</li>
        <li>RESEND_API_KEY, RESEND_FROM_EMAIL (optional)</li>
        <li>NEXT_PUBLIC_SITE_URL</li>
      </ul>
    </div>
  );
}
