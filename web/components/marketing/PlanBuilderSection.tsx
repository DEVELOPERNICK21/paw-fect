"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { Bell, Bug, Cat, Dog, HeartPulse, Stethoscope, Syringe } from "lucide-react";
import { useMemo, useState } from "react";
import { usePawPoints } from "@/components/gamification/PawPoints";
import { ScrollReveal } from "@/components/marketing/ScrollEffects";
import { StoreButtons } from "@/components/marketing/StoreButtons";
import {
  DEMO_STAGES,
  demoPlanFor,
  type DemoItemKind,
  type DemoLifestyle,
  type DemoSpecies,
  type DemoStage,
} from "@/lib/data/plan-demo";

const KIND_STYLE: Record<DemoItemKind, { icon: typeof Syringe; chip: string; label: string }> = {
  vaccine: { icon: Syringe, chip: "bg-orange-500/15 text-orange-600 dark:text-orange-300", label: "Vaccine" },
  deworm: { icon: Bug, chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", label: "Deworming" },
  checkup: { icon: Stethoscope, chip: "bg-sky-500/15 text-sky-700 dark:text-sky-300", label: "Checkup" },
  care: { icon: HeartPulse, chip: "bg-rose-500/15 text-rose-600 dark:text-rose-300", label: "Care" },
};

function Segmented<T extends string>({
  id,
  value,
  options,
  onChange,
  label,
}: {
  id: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string; icon?: typeof Dog }>;
  onChange: (v: T) => void;
  label: string;
}): React.ReactElement {
  return (
    <LayoutGroup id={id}>
      <div role="radiogroup" aria-label={label} className="flex rounded-full bg-stone-200/70 p-1 dark:bg-stone-800">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={`relative flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active ? "text-white dark:text-stone-900" : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              }`}
            >
              {active ? (
                <motion.span
                  layoutId={`${id}-pill`}
                  className="absolute inset-0 rounded-full bg-primary shadow-brand"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span className="relative inline-flex items-center justify-center gap-1.5">
                {o.icon ? <o.icon className="h-4 w-4" aria-hidden /> : null}
                {o.label}
              </span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

/**
 * Interactive "build a sample plan" demo. Lets a visitor see value in ten
 * seconds, then hands them to the store with the plan in mind.
 */
export function PlanBuilderSection(): React.ReactElement {
  const reduce = useReducedMotion();
  const { award } = usePawPoints();
  const [species, setSpeciesRaw] = useState<DemoSpecies>("dog");
  const [stage, setStageRaw] = useState<DemoStage>("puppy");
  const [lifestyle, setLifestyleRaw] = useState<DemoLifestyle>("indoor");
  const [name, setName] = useState("");
  const touch = (): void => award("plan-demo", 15);
  const setSpecies = (v: DemoSpecies): void => { setSpeciesRaw(v); touch(); };
  const setStage = (v: DemoStage): void => { setStageRaw(v); touch(); };
  const setLifestyle = (v: DemoLifestyle): void => { setLifestyleRaw(v); touch(); };

  const petName = name.trim() || (species === "dog" ? "Milo" : "Luna");
  const items = useMemo(() => demoPlanFor(species, stage, lifestyle), [species, stage, lifestyle]);
  const first = items[0];
  const stageMeta = DEMO_STAGES.find((s) => s.id === stage) ?? DEMO_STAGES[0];

  return (
    <section id="plan-demo" className="relative overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(242,140,40,0.14),transparent_55%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Try it now</p>
          <h2 className="max-w-2xl text-stone-900 dark:text-stone-50 text-3xl font-bold tracking-tight md:text-4xl mt-2">
            See your pet&apos;s care plan in 10 seconds
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-stone-600 dark:text-stone-400">
            Pick a pet and age. Pawfect lays out what usually comes next, then reminds you before each date.
          </p>
        </ScrollReveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-12">
          <ScrollReveal className="lg:col-span-5" direction="left">
            <div className="space-y-6 rounded-3xl border border-stone-200/60 bg-surface p-6 shadow-card dark:border-stone-700/50 dark:bg-stone-900/60 md:p-8">
              <div>
                <label htmlFor="demo-pet-name" className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  Pet&apos;s name <span className="font-normal text-stone-500">(optional)</span>
                </label>
                <input
                  id="demo-pet-name"
                  value={name}
                  maxLength={16}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={species === "dog" ? "Milo" : "Luna"}
                  className="mt-2 w-full rounded-xl border border-stone-300/60 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-stone-600/50 dark:bg-stone-800 dark:text-stone-50"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-stone-800 dark:text-stone-200">Dog or cat?</p>
                <Segmented<DemoSpecies>
                  id="species"
                  label="Species"
                  value={species}
                  onChange={setSpecies}
                  options={[
                    { value: "dog", label: "Dog", icon: Dog },
                    { value: "cat", label: "Cat", icon: Cat },
                  ]}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-stone-800 dark:text-stone-200">How old?</p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Age stage">
                  {DEMO_STAGES.map((s) => {
                    const active = s.id === stage;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setStage(s.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                          active
                            ? "border-primary bg-primary text-white shadow-brand dark:text-stone-900"
                            : "border-stone-300/60 bg-white text-stone-700 hover:border-primary/60 dark:border-stone-600/50 dark:bg-stone-800 dark:text-stone-200"
                        }`}
                      >
                        {s.range}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-stone-800 dark:text-stone-200">Lifestyle</p>
                <Segmented<DemoLifestyle>
                  id="lifestyle"
                  label="Lifestyle"
                  value={lifestyle}
                  onChange={setLifestyle}
                  options={[
                    { value: "indoor", label: "Mostly indoor" },
                    { value: "outdoor", label: "Outdoors often" },
                  ]}
                />
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal className="lg:col-span-7" direction="right">
            <div className="h-full rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-cream to-surface p-6 shadow-card dark:from-primary/15 dark:via-stone-900 dark:to-stone-900 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Sample plan</p>
                  <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
                    {petName}&apos;s next steps
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    {species === "dog" ? stageMeta.dog : stageMeta.cat} &middot; {stageMeta.range}
                  </p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.ul
                  key={`${species}-${stage}-${lifestyle}`}
                  initial={reduce ? false : "hidden"}
                  animate="show"
                  exit={reduce ? undefined : { opacity: 0, y: -8, transition: { duration: 0.12 } }}
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
                  className="mt-6 space-y-3"
                >
                  {items.map((item) => {
                    const k = KIND_STYLE[item.kind];
                    return (
                      <motion.li
                        key={item.title}
                        variants={{ hidden: { opacity: 0, x: 18 }, show: { opacity: 1, x: 0 } }}
                        className="flex items-center gap-4 rounded-2xl border border-stone-200/80 bg-white/80 p-4 backdrop-blur dark:border-stone-700/50 dark:bg-stone-800/60"
                      >
                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${k.chip}`}>
                          <k.icon className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-stone-900 dark:text-stone-50">{item.title}</span>
                          <span className="block text-sm text-stone-600 dark:text-stone-400">{item.when}</span>
                        </span>
                        <span className="hidden text-xs font-semibold text-stone-500 sm:block">{k.label}</span>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </AnimatePresence>

              <motion.div
                key={`${petName}-${first.title}`}
                initial={reduce ? false : { opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.35, type: "spring", stiffness: 260, damping: 22 }}
                className="mt-6 flex items-start gap-3 rounded-2xl bg-stone-900 p-4 text-stone-50 shadow-xl dark:bg-stone-950"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <Bell className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-sm leading-snug">
                  <span className="block font-semibold">Pawfect &middot; reminder</span>
                  <span className="text-stone-300">
                    {petName}&apos;s next up: {first.title}. Tap to log it when it&apos;s done.
                  </span>
                </span>
              </motion.div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <StoreButtons source="plan_demo" />
              </div>
              <p className="mt-4 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                Sample based on commonly used schedules. Timing varies by region and by pet, so always confirm with
                your vet. Pawfect builds the real plan from your pet&apos;s date of birth.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
