"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * Animated counter that counts up to `value` when scrolled into view.
 *
 * SSR-safe: the initial state is `value`, so the server-rendered HTML and
 * pre-hydration paint always show the real number. The "count from zero"
 * animation only runs when the element first enters the viewport AFTER
 * mount: so users with JS slow, blocked, or off never see a misleading
 * "0" sitting on the page.
 */
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
  const [display, setDisplay] = useState(value);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!inView || reduce || animatedRef.current) {
      return;
    }
    animatedRef.current = true;
    const duration = 800;
    const start = performance.now();
    const from = 0;
    setDisplay(from);
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
