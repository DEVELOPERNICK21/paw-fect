"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

const CARDS = [
  { title: "Rabies booster due in 3 days", sub: "Tap to book or log it", done: false },
  { title: "Deworming logged", sub: "Next one scheduled for you", done: true },
  { title: "Time for Milo's checkup", sub: "Last visit 11 months ago", done: false },
] as const;

/**
 * Notification-style cards that float beside the hero phone and cycle every few
 * seconds, so the first screen shows the product's core value (the reminder).
 */
export function HeroReminderCards(): React.ReactElement | null {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((n) => (n + 1) % CARDS.length), 3200);
    return () => clearInterval(t);
  }, [reduce]);

  const card = CARDS[i];
  return (
    <div className="pointer-events-none absolute -left-2 top-[18%] z-30 w-56 sm:-left-16 sm:w-64" aria-hidden>
      <AnimatePresence mode="wait">
        <motion.div
          key={card.title}
          initial={reduce ? false : { opacity: 0, x: -24, scale: 0.94 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 16, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="flex items-start gap-3 rounded-2xl border border-white/40 bg-white/90 p-3.5 shadow-2xl backdrop-blur dark:border-stone-700/50 dark:bg-stone-900/90"
        >
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${card.done ? "bg-emerald-500" : "bg-primary"}`}>
            {card.done ? <CheckCircle2 className="h-5 w-5" /> : <Bell className="h-4 w-4" />}
          </span>
          <span className="text-left text-sm leading-snug">
            <span className="block font-semibold text-stone-900 dark:text-stone-50">{card.title}</span>
            <span className="text-stone-600 dark:text-stone-400">{card.sub}</span>
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
