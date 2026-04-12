"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

const variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

export function AnimatedSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variants}
      transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
    >
      {children}
    </motion.div>
  );
}
