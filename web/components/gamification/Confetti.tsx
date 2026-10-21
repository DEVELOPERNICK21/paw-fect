"use client";

import { motion, useReducedMotion } from "framer-motion";

const COLORS = ["#F28C28", "#FFC857", "#34D399", "#60A5FA", "#F472B6"];

/** One-shot celebratory burst. Deterministic spread so SSR/CSR match. */
export function Confetti(): React.ReactElement | null {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 36 }, (_, i) => {
        const angle = (i / 36) * Math.PI * 2;
        const dist = 160 + ((i * 53) % 140);
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-sm"
            style={{ background: COLORS[i % COLORS.length] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist + 120,
              opacity: 0,
              rotate: 360 + i * 20,
              scale: 0.6,
            }}
            transition={{ duration: 1.6 + (i % 5) * 0.12, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
