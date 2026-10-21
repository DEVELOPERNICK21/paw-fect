"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useState } from "react";
import { usePawPoints } from "@/components/gamification/PawPoints";
import { ScrollReveal } from "@/components/marketing/ScrollEffects";
import { StoreButtons } from "@/components/marketing/StoreButtons";

const QUESTIONS = [
  "I know when my pet's next vaccine booster is due.",
  "My pet's vaccine records are in one place I can open at the vet.",
  "I know the right deworming interval for my pet's age.",
  "I get a reminder before a due date, not after.",
  "I could show my pet's full history to a boarder or new vet in a minute.",
] as const;

const ANSWERS = [
  { label: "Yes", score: 2, emoji: "🐶" },
  { label: "Sort of", score: 1, emoji: "🤔" },
  { label: "Not yet", score: 0, emoji: "🙈" },
] as const;

function result(pct: number): { title: string; body: string } {
  if (pct >= 80) return { title: "Paw-fect Parent", body: "You're ahead of most. Pawfect keeps it all in one calm place so nothing slips." };
  if (pct >= 50) return { title: "Almost There", body: "A few gaps. Reminders and one tidy record would close them." };
  return { title: "Busy-Parent Mode", body: "Totally normal. Pawfect carries the dates so you don't have to remember them." };
}

/** 1-minute self check. Ends in a score and a tailored nudge toward the app. */
export function PetParentQuizSection(): React.ReactElement {
  const reduce = useReducedMotion();
  const { award } = usePawPoints();
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<number[]>([]);

  const finished = step >= QUESTIONS.length;
  const total = scores.reduce((a, b) => a + b, 0);
  const pct = Math.round((total / (QUESTIONS.length * 2)) * 100);
  const gaps = scores.filter((s) => s < 2).length;
  const r = result(pct);

  const answer = (score: number): void => {
    const next = [...scores, score];
    setScores(next);
    setStep(step + 1);
    if (next.length === QUESTIONS.length) award("quiz", 40);
  };

  return (
    <section id="care-check" className="relative overflow-hidden py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-primary">1-minute care check</p>
          <h2 className="text-center text-stone-900 dark:text-stone-50 text-3xl font-bold tracking-tight md:text-4xl mt-2">
            How ready is your pet&apos;s care routine?
          </h2>
        </ScrollReveal>

        <div className="mt-10 overflow-hidden rounded-3xl bg-surface p-6 shadow-card ring-1 ring-black/5 dark:bg-stone-900/70 dark:ring-white/10 md:p-10">
          {!finished ? (
            <>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                  <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${(step / QUESTIONS.length) * 100}%` }} transition={{ type: "spring", stiffness: 160, damping: 22 }} />
                </div>
                <span className="text-xs font-semibold text-stone-500">{step + 1} / {QUESTIONS.length}</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={reduce ? false : { opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="mt-8 text-xl font-semibold text-stone-900 dark:text-stone-50 md:text-2xl">{QUESTIONS[step]}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {ANSWERS.map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        onClick={() => answer(a.score)}
                        className="rounded-2xl bg-stone-100 px-4 py-4 text-base font-semibold text-stone-800 transition hover:-translate-y-0.5 hover:bg-primary hover:text-white hover:shadow-brand active:scale-95 dark:bg-stone-800 dark:text-stone-100 dark:hover:text-stone-900"
                      >
                        <span className="mr-2" aria-hidden>{a.emoji}</span>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </>
          ) : (
            <motion.div initial={reduce ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="relative mx-auto h-36 w-36">
                <svg viewBox="0 0 100 100" className="-rotate-90" aria-hidden>
                  <circle cx="50" cy="50" r="44" fill="none" strokeWidth="8" className="stroke-stone-200 dark:stroke-stone-700" />
                  <motion.circle cx="50" cy="50" r="44" fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-primary" strokeDasharray={2 * Math.PI * 44} initial={{ strokeDashoffset: 2 * Math.PI * 44 }} animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - pct / 100) }} transition={{ duration: 1.1, ease: "easeOut" }} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-4xl font-black text-stone-900 dark:text-stone-50">{pct}</span>
              </div>
              <h3 className="mt-5 text-2xl font-bold text-stone-900 dark:text-stone-50">{r.title}</h3>
              <p className="mx-auto mt-2 max-w-md text-stone-600 dark:text-stone-300">{r.body}</p>
              {gaps > 0 ? (
                <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                  {gaps} {gaps === 1 ? "area" : "areas"} Pawfect can take off your plate. +40 paw points earned.
                </p>
              ) : null}
              <div className="mt-6 flex flex-col items-center gap-4">
                <StoreButtons source="quiz" />
                <button type="button" onClick={() => { setStep(0); setScores([]); }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200">
                  <RotateCcw className="h-4 w-4" aria-hidden /> Retake
                </button>
              </div>
            </motion.div>
          )}
        </div>
        {!finished ? (
          <p className="mt-4 flex items-center justify-center gap-1 text-center text-xs text-stone-500">
            Private: your answers stay in your browser <ArrowRight className="h-3 w-3" aria-hidden />
          </p>
        ) : null}
      </div>
    </section>
  );
}
