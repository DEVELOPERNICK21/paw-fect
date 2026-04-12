"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Subtle repeating paw-dot texture (CSS-only, no images). */
export function PawDotField({ className = "" }: { className?: string }): React.ReactElement {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden opacity-[0.35] dark:opacity-[0.2] ${className}`}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, var(--color-primary) 0 1.5px, transparent 2px),
            radial-gradient(circle at 60% 70%, var(--color-primary) 0 1.5px, transparent 2px),
            radial-gradient(circle at 80% 20%, var(--color-accent) 0 1px, transparent 1.5px)`,
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}

export function WarmBlob({
  className,
  blur = "3xl",
}: {
  className: string;
  blur?: "2xl" | "3xl";
}): React.ReactElement {
  const blurClass = blur === "3xl" ? "blur-3xl" : "blur-2xl";
  return (
    <div
      className={`pointer-events-none absolute rounded-full bg-gradient-to-br from-primary/30 via-accent/20 to-primary-light/25 dark:from-primary/15 dark:via-accent/10 ${blurClass} ${className}`}
      aria-hidden
    />
  );
}

export function FloatingEmoji({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className: string;
  delay?: number;
}): React.ReactElement {
  const reduce = useReducedMotion();
  if (reduce) {
    return <span className={className}>{children}</span>;
  }
  return (
    <motion.span
      className={`pointer-events-none absolute select-none text-4xl md:text-5xl ${className}`}
      aria-hidden
      initial={{ y: 0, rotate: -6 }}
      animate={{ y: [-4, 4, -4], rotate: [-6, 6, -6] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {children}
    </motion.span>
  );
}
