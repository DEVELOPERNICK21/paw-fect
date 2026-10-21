"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronUp, PawPrint, Trophy, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Confetti } from "@/components/gamification/Confetti";
import { StoreButtons } from "@/components/marketing/StoreButtons";

const STORAGE_KEY = "pawfect.pawpoints.v1";
export const REWARD_POINTS = 100;

/** Everything a visitor can do to earn points. Shown in the checklist. */
export const QUESTS: ReadonlyArray<{ id: string; label: string; points: number }> = [
  { id: "plan-demo", label: "Build a sample care plan", points: 15 },
  { id: "quiz", label: "Take the 1-minute care check", points: 40 },
  { id: "gallery", label: "Browse the app screens", points: 10 },
  { id: "premium-toggle", label: "Flip Free vs Care+", points: 10 },
  { id: "hidden-paws", label: "Find hidden paw prints (10 each)", points: 0 },
];

interface Stored {
  done: string[];
  points: number;
  rewarded: boolean;
}

interface PawPointsContextValue {
  points: number;
  done: ReadonlySet<string>;
  award: (id: string, points: number) => void;
}

const Ctx = createContext<PawPointsContextValue | null>(null);

const noop: PawPointsContextValue = { points: 0, done: new Set(), award: () => undefined };

export function usePawPoints(): PawPointsContextValue {
  return useContext(Ctx) ?? noop;
}

function read(): Stored {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Stored>;
      return { done: Array.isArray(p.done) ? p.done : [], points: Number(p.points) || 0, rewarded: Boolean(p.rewarded) };
    }
  } catch {
    // storage unavailable: play without saving
  }
  return { done: [], points: 0, rewarded: false };
}

/**
 * Lightweight "Paw Points" game for the marketing site. Visitors earn points by
 * exploring; reaching the goal shows a badge. No discounts or prizes are promised.
 */
export function PawPointsProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const reduce = useReducedMotion();
  const [state, setState] = useState<Stored>({ done: [], points: 0, rewarded: false });
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [popup, setPopup] = useState<{ id: number; text: string } | null>(null);
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    setState(read());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, ready]);

  const award = useCallback((id: string, pts: number) => {
    setState((s) => {
      if (s.done.includes(id)) return s;
      const points = s.points + pts;
      return { ...s, done: [...s.done, id], points };
    });
    setPopup({ id: Date.now(), text: `+${pts} paw points` });
  }, []);

  useEffect(() => {
    if (!popup) return;
    const t = setTimeout(() => setPopup(null), 1800);
    return () => clearTimeout(t);
  }, [popup]);

  useEffect(() => {
    if (ready && state.points >= REWARD_POINTS && !state.rewarded) {
      setShowReward(true);
      setState((s) => ({ ...s, rewarded: true }));
    }
  }, [ready, state.points, state.rewarded]);

  const value = useMemo<PawPointsContextValue>(
    () => ({ points: state.points, done: new Set(state.done), award }),
    [state.points, state.done, award],
  );
  const pct = Math.min(100, Math.round((state.points / REWARD_POINTS) * 100));
  const hiddenFound = state.done.filter((d) => d.startsWith("paw-")).length;

  return (
    <Ctx.Provider value={value}>
      {children}

      <div className="fixed bottom-24 left-3 z-[55] md:bottom-6 md:left-5">
        <AnimatePresence>
          {open ? (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              className="mb-3 w-72 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/5 dark:bg-stone-900 dark:ring-white/10"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-stone-900 dark:text-stone-50">Paw quests</p>
                <button type="button" aria-label="Close quests" onClick={() => setOpen(false)} className="rounded-full p-1 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                Earn {REWARD_POINTS} points to unlock the Pawfect Pet Parent badge.
              </p>
              <ul className="mt-3 space-y-2">
                {QUESTS.map((q) => {
                  const isDone = q.id === "hidden-paws" ? hiddenFound >= 5 : state.done.includes(q.id);
                  return (
                    <li key={q.id} className="flex items-center gap-2.5 text-sm text-stone-700 dark:text-stone-200">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isDone ? "bg-primary text-white" : "bg-stone-200 dark:bg-stone-700"}`}>
                        {isDone ? <Check className="h-3 w-3" /> : null}
                      </span>
                      <span className="flex-1">{q.id === "hidden-paws" ? `Hidden paw prints (${hiddenFound}/5)` : q.label}</span>
                      {q.points > 0 ? <span className="text-xs font-semibold text-primary">+{q.points}</span> : null}
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={`Paw points: ${state.points} of ${REWARD_POINTS}. Open quests`}
          className="group flex items-center gap-2.5 rounded-full bg-white py-1.5 pl-1.5 pr-4 shadow-xl ring-1 ring-black/5 transition hover:-translate-y-0.5 dark:bg-stone-900 dark:ring-white/10"
        >
          <span className="relative flex h-10 w-10 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40" aria-hidden>
              <circle cx="20" cy="20" r="17" fill="none" strokeWidth="3" className="stroke-stone-200 dark:stroke-stone-700" />
              <motion.circle
                cx="20" cy="20" r="17" fill="none" strokeWidth="3" strokeLinecap="round"
                className="stroke-primary"
                strokeDasharray={2 * Math.PI * 17}
                animate={{ strokeDashoffset: 2 * Math.PI * 17 * (1 - pct / 100) }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </svg>
            <PawPrint className="h-4 w-4 text-primary transition group-hover:rotate-12" aria-hidden />
          </span>
          <span className="text-left leading-tight">
            <span className="block text-sm font-bold text-stone-900 dark:text-stone-50">{state.points} pts</span>
            <span className="block text-[11px] text-stone-500 dark:text-stone-400">{state.points >= REWARD_POINTS ? "Badge unlocked" : "Paw quests"}</span>
          </span>
          <ChevronUp className={`h-4 w-4 text-stone-400 transition ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>

        <AnimatePresence>
          {popup ? (
            <motion.span
              key={popup.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: -8 }}
              exit={{ opacity: 0, y: -22 }}
              className="pointer-events-none absolute -top-2 left-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-lg dark:text-stone-900"
            >
              {popup.text}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showReward ? (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Badge unlocked"
          >
            <Confetti />
            <motion.div
              initial={reduce ? false : { scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
              className="relative w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl dark:bg-stone-900"
            >
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-white shadow-brand">
                <Trophy className="h-10 w-10" aria-hidden />
              </span>
              <h3 className="mt-5 text-2xl font-black text-stone-900 dark:text-stone-50">Pet Parent badge unlocked!</h3>
              <p className="mt-2 text-stone-600 dark:text-stone-300">
                You explored like a pro. Your pet&apos;s plan is one download away, and Pawfect is free to start.
              </p>
              <div className="mt-6 flex justify-center">
                <StoreButtons source="rewards" />
              </div>
              <button type="button" onClick={() => setShowReward(false)} className="mt-4 text-sm font-semibold text-stone-500 underline-offset-4 hover:underline">
                Keep exploring
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Ctx.Provider>
  );
}
