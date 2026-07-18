"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

/**
 * Thin brand progress bar at the top of the viewport.
 * Communicates reading progress while scrolling the marketing page.
 */
export function ScrollProgress(): React.ReactElement | null {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  if (reduce) {
    return null;
  }

  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-primary via-primary-dark to-accent"
      style={{ scaleX }}
      aria-hidden
    />
  );
}

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Horizontal shift direction for variety. */
  direction?: "up" | "left" | "right";
  delay?: number;
};

export function ScrollReveal({
  children,
  className = "",
  direction = "up",
  delay = 0,
}: ScrollRevealProps): React.ReactElement {
  const reduce = useReducedMotion();
  const offset =
    direction === "left" ? { x: -36, y: 0 } : direction === "right" ? { x: 36, y: 0 } : { x: 0, y: 36 };

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: "-60px" }}
      transition={{
        duration: 0.65,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
