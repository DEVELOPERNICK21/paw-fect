import { WaitlistForm } from "@/components/marketing/WaitlistForm";

export function WaitlistSection({
  compact = false,
}: {
  compact?: boolean;
}): React.ReactElement {
  return (
    <section
      className={
        compact
          ? "rounded-2xl border border-stone-200 bg-surface p-6 dark:border-stone-700 dark:bg-stone-900/50"
          : "border-t border-stone-200 bg-cream/40 py-16 dark:border-stone-800 dark:bg-stone-900/30 md:py-20"
      }
    >
      <div className={compact ? "" : "mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8"}>
        <h2
          className={
            compact
              ? "text-lg font-semibold text-stone-900 dark:text-stone-50"
              : "text-2xl font-bold text-stone-900 dark:text-stone-50 md:text-3xl"
          }
        >
          Join the waitlist
        </h2>
        <p
          className={
            compact
              ? "mt-2 text-sm text-stone-600 dark:text-stone-400"
              : "mx-auto mt-3 max-w-lg text-stone-600 dark:text-stone-400"
          }
        >
          Be first to hear about web updates. Leave your email once. No spam. Unsubscribe anytime.
        </p>
        <div className={compact ? "mt-4" : "mx-auto mt-8 max-w-md"}>
          <WaitlistForm compact={compact} />
        </div>
      </div>
    </section>
  );
}
