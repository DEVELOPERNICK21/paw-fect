"use client";

import { Button } from "@/components/ui/Button";
import { dogJourneyStages, type DogJourneyStage } from "@/lib/data/dog-journey-stages";
import { motion, useReducedMotion } from "framer-motion";
import { Footprints } from "lucide-react";
import { useState } from "react";

type PetJourneySectionProps = {
  variant?: "scroll" | "static";
  showCta?: boolean;
  embedded?: boolean;
};

function JourneyHeader({
  compact = false,
}: {
  compact?: boolean;
}): React.ReactElement {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Life stages</p>
      <h2
        className={`mt-3 font-bold text-stone-900 dark:text-stone-50 ${
          compact ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl lg:text-[2.5rem]"
        }`}
      >
        Your dog&apos;s journey
      </h2>
      <p className="mt-3 max-w-xl text-base leading-relaxed text-stone-600 dark:text-stone-400 md:text-lg">
        Tap a stage to see how care needs change from puppyhood to adulthood.
      </p>
    </div>
  );
}

function DogJourneyStageCard({ stage }: { stage: DogJourneyStage }): React.ReactElement {
  return (
    <div
      className="rounded-2xl border border-primary/20 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-primary/25 dark:bg-stone-900/70 md:p-6"
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl md:text-4xl" aria-hidden>
          {stage.emoji}
        </span>
        <div>
          <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50 md:text-2xl">
            {stage.title}
          </h3>
          <p className="mt-1 text-sm font-medium text-stone-500 dark:text-stone-400">{stage.age}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{stage.summary}</p>
      <ul className="mt-4 space-y-2 text-sm text-stone-600 dark:text-stone-400">
        {stage.points.map((point) => (
          <li key={point} className="flex gap-2">
            <span className="text-primary" aria-hidden>
              ✓
            </span>
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}

function JourneyStagePicker({
  activeIndex,
  onSelect,
}: {
  activeIndex: number;
  onSelect: (index: number) => void;
}): React.ReactElement {
  return (
    <div
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      role="tablist"
      aria-label="Dog life stages"
    >
      {dogJourneyStages.map((stage, i) => {
        const isActive = i === activeIndex;
        return (
          <button
            key={stage.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(i)}
            className={`shrink-0 rounded-full border px-4 py-2 text-left transition active:scale-[0.98] ${
              isActive
                ? "border-primary bg-primary text-white shadow-brand dark:text-stone-900"
                : "border-stone-200 bg-surface text-stone-700 hover:border-primary/40 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
            }`}
          >
            <span className="block text-sm font-semibold">{stage.title}</span>
            <span
              className={`block text-xs ${isActive ? "text-white/85 dark:text-stone-900/70" : "text-stone-500"}`}
            >
              {stage.age}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function InteractiveJourney({
  showCta,
  embedded = false,
}: {
  showCta: boolean;
  embedded?: boolean;
}): React.ReactElement {
  const reduce = useReducedMotion();
  const [activeStage, setActiveStage] = useState(0);
  const active = dogJourneyStages[activeStage] ?? dogJourneyStages[0];

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-12">
        <div className="lg:col-span-5">
          {!embedded ? <JourneyHeader /> : null}
          <div className={embedded ? "" : "mt-6"}>
            <JourneyStagePicker activeIndex={activeStage} onSelect={setActiveStage} />
          </div>
          {showCta ? (
            <div className="mt-8 hidden lg:block">
              <Button href="/features#journey">Explore journey</Button>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-7">
          <motion.div
            key={active.id}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <DogJourneyStageCard stage={active} />
          </motion.div>
          {showCta ? (
            <div className="mt-8 lg:hidden">
              <Button href="/features#journey">Explore journey</Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function PetJourneySection({
  variant = "scroll",
  showCta = true,
  embedded = false,
}: PetJourneySectionProps): React.ReactElement {
  // Interactive picker replaces the old 350vh sticky scroll (blank space + scroll cue).
  void variant;

  return (
    <section
      id={variant === "static" ? undefined : "dog-journey"}
      className={`relative overflow-hidden bg-gradient-to-b from-primary/15 via-primary/10 to-background dark:from-primary/10 dark:via-stone-900/50 dark:to-background ${
        embedded ? "py-10 md:py-12" : "py-16 md:py-24"
      }`}
    >
      <div className="pointer-events-none absolute -right-20 top-20 text-[12rem] opacity-[0.07] dark:opacity-[0.05]">
        <Footprints aria-hidden />
      </div>
      <InteractiveJourney showCta={showCta} embedded={embedded} />
    </section>
  );
}
