"use client";

import { Button } from "@/components/ui/Button";

export default function MarketingError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Something went wrong</h1>
      <p className="mt-4 text-stone-600 dark:text-stone-400">Please try again.</p>
      <div className="mt-8 flex justify-center gap-4">
        <Button type="button" onClick={() => reset()}>
          Retry
        </Button>
        <Button href="/" variant="secondary">
          Home
        </Button>
      </div>
    </div>
  );
}
