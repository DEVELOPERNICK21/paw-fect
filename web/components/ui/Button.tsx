import Link from "next/link";

type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
} & (
  | { href: string; onClick?: never; type?: never; disabled?: never }
  | {
      href?: never;
      onClick?: () => void;
      type?: "button" | "submit";
      disabled?: boolean;
    }
);

export function Button({
  children,
  className = "",
  variant = "primary",
  ...rest
}: ButtonProps): React.ReactElement {
  const base =
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]";
  const styles =
    variant === "primary"
      ? "bg-primary text-white shadow-brand hover:bg-primary-dark hover:brightness-105 dark:text-stone-900"
      : variant === "secondary"
        ? "border border-border bg-surface text-foreground shadow-sm hover:bg-stone-50 hover:shadow-md dark:hover:bg-stone-800"
        : "text-foreground hover:bg-stone-100 dark:hover:bg-stone-800";

  if ("href" in rest && rest.href) {
    return (
      <Link href={rest.href} className={`${base} ${styles} ${className}`}>
        {children}
      </Link>
    );
  }

  const { onClick, type = "button", disabled } = rest as {
    onClick?: () => void;
    type?: "button" | "submit";
    disabled?: boolean;
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </button>
  );
}
