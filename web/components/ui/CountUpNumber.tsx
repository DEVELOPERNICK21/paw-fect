"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function CountUpNumber({
  value,
  suffix = "",
  prefix = "",
}: {
  value: number;
  suffix?: string;
  prefix?: string;
}): React.ReactElement {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || reduce) {
      setDisplay(value);
      return;
    }
    const duration = 800;
    const start = performance.now();
    const from = 0;
    const tick = (now: number): void => {
      const p = Math.min(1, (now - start) / duration);
      setDisplay(Math.floor(from + (value - from) * p));
      if (p < 1) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }, [inView, value, reduce]);

  return (
    <motion.span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </motion.span>
  );
}
