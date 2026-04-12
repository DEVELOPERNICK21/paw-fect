export function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-dark dark:text-primary ${className}`}
    >
      {children}
    </span>
  );
}
