"use client";

import { Button } from "@/components/ui/Button";
import { dogJourneyStages, type DogJourneyStage } from "@/lib/data/dog-journey-stages";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Footprints } from "lucide-react";
import { useRef, useState } from "react";

type PetJourneySectionProps = {
  variant?: "scroll" | "static";
  showCta?: boolean;
  embedded?: boolean;
};

function JourneyHeader({
  compact = false,
  staticMode = false,
}: {
  compact?: boolean;
  staticMode?: boolean;
}): React.ReactElement {
  return (
    <div className={compact ? "" : "mb-8 lg:mb-0"}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Life stages</p>
      <h2
        className={`mt-3 font-bold text-stone-900 dark:text-stone-50 ${
          compact ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl lg:text-[2.5rem]"
        }`}
      >
        Your dog&apos;s journey
      </h2>
      <p className="mt-4 text-lg text-stone-600 dark:text-stone-400">
        {staticMode
          ? "Explore each stage to see how care needs change from puppyhood to adulthood — clear, calm, and actionable."
          : "Scroll through each stage to see how care needs change from puppyhood to adulthood — clear, calm, and actionable."}
      </p>
    </div>
  );
}

function DogJourneyStageCard({
  stage,
  showLabel = true,
}: {
  stage: DogJourneyStage;
  showLabel?: boolean;
}): React.ReactElement {
  return (
    <div
      className="rounded-3xl border border-primary/20 bg-white/70 p-6 shadow-sm backdrop-blur-sm dark:border-primary/25 dark:bg-stone-900/60"
      aria-live="polite"
    >
      {showLabel ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Active stage</p>
      ) : null}
      <div className={showLabel ? "mt-2 flex items-start gap-4" : "flex items-start gap-4"}>
        <span className="text-4xl" aria-hidden>
          {stage.emoji}
        </span>
        <div>
          <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-50">{stage.title}</h3>
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

function JourneyTimeline({
  activeIndex,
  progress = (activeIndex + 1) / dogJourneyStages.length,
  onSelect,
  interactive = false,
}: {
  activeIndex: number;
  progress?: number;
  onSelect?: (index: number) => void;
  interactive?: boolean;
}): React.ReactElement {
  return (
    <div className="relative pl-2">
      <div className="absolute bottom-2 left-[11px] top-2 w-0.5 overflow-hidden rounded-full bg-primary/20">
        <motion.div
          className="absolute inset-x-0 top-0 h-full origin-top rounded-full bg-gradient-to-b from-primary via-primary/70 to-primary/40"
          animate={{ scaleY: progress }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>
      <div className="space-y-3">
        {dogJourneyStages.map((stage, i) => {
          const isActive = i === activeIndex;
          const content = (
            <>
              <span
                className={`absolute left-0 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[10px] font-bold transition ${
                  isActive
                    ? "border-primary bg-primary text-white"
                    : "border-primary/50 bg-surface text-primary"
                }`}
              >
                {i + 1}
              </span>
              <span>
                <span className="block text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {stage.title}
                </span>
                <span className="block text-xs text-stone-500 dark:text-stone-400">{stage.age}</span>
              </span>
            </>
          );

          if (interactive && onSelect) {
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => onSelect(i)}
                onFocus={() => onSelect(i)}
                className={`relative flex w-full items-center gap-4 rounded-2xl border py-3 pl-8 pr-4 text-left transition ${
                  isActive
                    ? "border-primary/40 bg-white/90 shadow-md shadow-primary/10 dark:border-primary/30 dark:bg-stone-800/90"
                    : "border-transparent bg-white/40 dark:bg-stone-800/30"
                }`}
              >
                {content}
              </button>
            );
          }

          return (
            <div
              key={stage.id}
              className={`relative flex items-center gap-4 rounded-2xl border py-3 pl-8 pr-4 transition ${
                isActive
                  ? "border-primary/40 bg-white/90 shadow-md shadow-primary/10 dark:border-primary/30 dark:bg-stone-800/90"
                  : "border-transparent bg-white/40 dark:bg-stone-800/30"
              }`}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StaticJourneyFallback({
  showCta,
  embedded = false,
}: {
  showCta: boolean;
  embedded?: boolean;
}): React.ReactElement {
  const [activeStage, setActiveStage] = useState(0);
  const active = dogJourneyStages[activeStage] ?? dogJourneyStages[0];

  return (
    <div className="relative mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
      <JourneyTimeline activeIndex={activeStage} onSelect={setActiveStage} interactive />
      <div>
        {!embedded ? <JourneyHeader staticMode /> : null}
        <DogJourneyStageCard stage={active} />
        {showCta ? (
          <div className="mt-10">
            <Button href="/features#journey">Explore journey</Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DogJourneyScrollMobile({ showCta }: { showCta: boolean }): React.ReactElement {
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:hidden lg:px-8">
      <JourneyHeader />
      <div className="mt-10 space-y-6">
        {dogJourneyStages.map((stage, i) => (
          <MobileStageBlock key={stage.id} stage={stage} index={i} reduce={!!reduce} />
        ))}
      </div>
      {showCta ? (
        <div className="mt-10">
          <Button href="/features#journey">Explore journey</Button>
        </div>
      ) : null}
    </div>
  );
}

function MobileStageBlock({
  stage,
  index,
  reduce,
}: {
  stage: DogJourneyStage;
  index: number;
  reduce: boolean;
}): React.ReactElement {
  const ref = useRef(null);
  const inView = useInView(ref, { margin: "-30% 0px -30% 0px" });

  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={
        inView
          ? { opacity: 1, y: 0, scale: 1 }
          : reduce
            ? undefined
            : { opacity: 0.55, y: 0, scale: 0.98 }
      }
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`rounded-3xl border p-1 transition ${
        inView ? "border-primary/40 shadow-md shadow-primary/10" : "border-transparent"
      }`}
    >
      <DogJourneyStageCard stage={stage} showLabel={false} />
    </motion.div>
  );
}

function DogJourneyScrollDesktop({ showCta }: { showCta: boolean }): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStage, setActiveStage] = useState(0);
  const [lineFill, setLineFill] = useState(0.25);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const stageProgress = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [0, 1, 2, 3, 3]);
  const lineProgress = useTransform(scrollYProgress, [0, 1], [0.25, 1]);
  const emojiScale = useTransform(scrollYProgress, [0, 0.33, 0.66, 1], [0.8, 1, 1.1, 1.2]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [1, 0.6, 0.6, 0]);

  useMotionValueEvent(stageProgress, "change", (latest) => {
    setActiveStage(Math.round(latest));
  });

  useMotionValueEvent(lineProgress, "change", (latest) => {
    setLineFill(latest);
  });

  const active = dogJourneyStages[activeStage] ?? dogJourneyStages[0];

  return (
    <div ref={containerRef} className="relative hidden lg:block" style={{ height: "350vh" }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="relative mx-auto grid w-full max-w-7xl grid-cols-2 items-center gap-16 px-8">
          <div>
            <JourneyTimeline activeIndex={activeStage} progress={lineFill} />
            <motion.div className="mt-8 text-[5rem] opacity-20" style={{ scale: emojiScale }} aria-hidden>
              {active.emoji}
            </motion.div>
          </div>
          <div>
            <JourneyHeader compact />
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <DogJourneyStageCard stage={active} />
              </motion.div>
            </AnimatePresence>
            {showCta ? (
              <div className="mt-10">
                <Button href="/features#journey">Explore journey</Button>
              </div>
            ) : null}
          </div>
        </div>
        <motion.div
          className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-stone-500 dark:text-stone-400"
          style={{ opacity: hintOpacity }}
        >
          Scroll to explore each stage
        </motion.div>
      </div>
    </div>
  );
}

export function PetJourneySection({
  variant = "scroll",
  showCta = true,
  embedded = false,
}: PetJourneySectionProps): React.ReactElement {
  const reduce = useReducedMotion();
  const useStatic = variant === "static" || reduce;

  return (
    <section
      id={variant === "static" ? undefined : "dog-journey"}
      className={`relative overflow-hidden bg-gradient-to-b from-primary/15 via-primary/10 to-background dark:from-primary/10 dark:via-stone-900/50 dark:to-background ${
        embedded ? "py-12 md:py-16" : "py-24 md:py-32"
      }`}
    >
      <div className="pointer-events-none absolute -right-20 top-20 text-[12rem] opacity-[0.07] dark:opacity-[0.05]">
        <Footprints aria-hidden />
      </div>
      {useStatic ? (
        <StaticJourneyFallback showCta={showCta} embedded={embedded} />
      ) : (
        <>
          <DogJourneyScrollDesktop showCta={showCta} />
          <DogJourneyScrollMobile showCta={showCta} />
        </>
      )}
    </section>
  );
}
