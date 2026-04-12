import Link from "next/link";

export default function NotFound(): React.ReactElement {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Page not found</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-400">The page you requested does not exist.</p>
      <Link href="/" className="mt-8 text-primary hover:underline">
        Back to home
      </Link>
    </div>
  );
}
