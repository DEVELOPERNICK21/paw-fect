export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div
      className={`rounded-2xl border border-stone-200 bg-surface p-6 shadow-card transition duration-250 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card-hover dark:border-stone-700 dark:hover:border-primary/30 ${className}`}
    >
      {children}
    </div>
  );
}
