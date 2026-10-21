"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";

/** Floating hearts that rise from the bottom of a relative parent. Re-trigger by changing `burst`. */
export function HeartBurst({ burst }: { burst: number }): React.ReactElement | null {
  const reduce = useReducedMotion();
  if (reduce || burst === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <AnimatePresence>
        {Array.from({ length: 7 }, (_, i) => (
          <motion.span
            key={`${burst}-${i}`}
            className="absolute bottom-6 text-rose-400"
            style={{ left: `${18 + i * 11}%` }}
            initial={{ y: 0, opacity: 0, scale: 0.5 }}
            animate={{ y: -140 - (i % 3) * 40, opacity: [0, 1, 0], scale: 1 + (i % 3) * 0.25, x: (i % 2 ? 1 : -1) * 14 }}
            transition={{ duration: 1.6, delay: i * 0.07, ease: "easeOut" }}
          >
            <Heart className="h-6 w-6 fill-current" />
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
