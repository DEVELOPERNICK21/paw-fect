"use client";

import Link from "next/link";
import { Dog, Download } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export function StickyMobileCta(): React.ReactElement {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200/90 bg-surface/95 px-4 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-stone-700 dark:bg-stone-900/95 md:hidden"
      initial={reduce ? false : { y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 28, delay: 0.4 }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-stone-800 dark:text-stone-200">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Dog className="h-5 w-5" aria-hidden />
          </span>
          <span>Your pet&apos;s schedule, in your pocket</span>
        </div>
        <Link
          href="/download"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/25 transition active:scale-[0.98] dark:text-stone-900"
        >
          <Download className="h-4 w-4" aria-hidden />
          Get app
        </Link>
      </div>
    </motion.div>
  );
}
