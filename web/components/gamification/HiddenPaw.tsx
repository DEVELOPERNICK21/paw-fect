"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PawPrint } from "lucide-react";
import { usePawPoints } from "@/components/gamification/PawPoints";

/** A hidden collectible paw print. Place inside a `relative` parent. */
export function HiddenPaw({ id, className = "" }: { id: string; className?: string }): React.ReactElement {
  const { done, award } = usePawPoints();
  const key = `paw-${id}`;
  return (
    <AnimatePresence>
      {done.has(key) ? null : (
        <motion.button
          type="button"
          aria-label="Hidden paw print: collect for 10 paw points"
          onClick={() => award(key, 10)}
          exit={{ scale: 2, opacity: 0, rotate: 40 }}
          whileHover={{ scale: 1.25, rotate: -12, opacity: 1 }}
          whileTap={{ scale: 0.85 }}
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ rotate: { repeat: Infinity, duration: 4, repeatDelay: 3 } }}
          className={`absolute z-20 text-primary/30 transition-colors hover:text-primary ${className}`}
        >
          <PawPrint className="h-7 w-7" aria-hidden />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
