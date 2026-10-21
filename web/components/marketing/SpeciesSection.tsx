"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import speciesDog from "@/app/assets/Images/species-dog.png";
import speciesCat from "@/app/assets/Images/species-cat.png";
import { HeartBurst } from "@/components/marketing/HeartBurst";
import { ScrollReveal } from "@/components/marketing/ScrollEffects";

const species = [
  {
    title: "For the one who waits at the door",
    label: "Dogs",
    image: speciesDog,
    alt: "Golden retriever outdoors in soft morning light",
    story:
      "Puppy shots, boosters, deworming. They trust you with all of it. Pawfect remembers every date so you can just be the one they run to.",
    button: "Hear from your dog",
    notes: [
      "You're home! Did you remember my booster? (You did. Good human.)",
      "Walk first, vaccines tracked. Best deal ever.",
      "Whatever you do today, I'm just glad it's with you.",
    ],
    points: ["Puppy DP, DHPPiL schedules", "Bordetella & Lyme where relevant", "Lifestyle-based risk adjustments"],
    direction: "left" as const,
  },
  {
    title: "For the one who pretends not to care",
    label: "Cats",
    image: speciesCat,
    alt: "Domestic cat on a sunny windowsill",
    story:
      "They'll never remind you. They just sit in the window and trust you. Pawfect keeps their care on track, quietly, like they'd expect.",
    button: "Hear from your cat",
    notes: [
      "I don't need a checkup. (Thank you for booking it anyway.)",
      "Slow blink. That means I love you.",
      "My sunny spot, my human, my schedule on time.",
    ],
    points: ["FVRCP & Rabies cadence", "FeLV for at-risk cats", "Indoor vs outdoor protocols"],
    direction: "right" as const,
  },
];

function SpeciesCard({ s }: { s: (typeof species)[number] }): React.ReactElement {
  const reduce = useReducedMotion();
  const [i, setI] = useState(-1);
  const [burst, setBurst] = useState(0);

  const next = (): void => {
    setI((n) => (n + 1) % s.notes.length);
    setBurst((b) => b + 1);
  };

  return (
    <article className="group relative overflow-hidden rounded-3xl bg-stone-900 shadow-card ring-1 ring-black/5 dark:ring-white/10">
      <div className="relative aspect-[4/5] w-full sm:aspect-[4/4.2]">
        <Image
          src={s.image}
          alt={s.alt}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/55 to-transparent" />
        <HeartBurst burst={burst} />

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{s.label}</p>
          <h3 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl">{s.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-stone-200 sm:text-base">{s.story}</p>

          <div className="mt-5 min-h-[3.25rem]">
            <AnimatePresence mode="wait">
              {i >= 0 ? (
                <motion.p
                  key={i}
                  initial={reduce ? false : { opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="inline-block rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm font-medium text-stone-900 shadow-xl"
                >
                  {s.notes[i]}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-stone-900 shadow-brand transition hover:brightness-110 active:scale-95"
            >
              <Heart className="h-4 w-4 fill-current" aria-hidden />
              {i < 0 ? s.button : "Again"}
            </button>
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-300">
              {s.points.map((p) => (
                <li key={p} className="flex items-center gap-1">
                  <span className="text-primary" aria-hidden>✓</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}

export function SpeciesSection(): React.ReactElement {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Dogs &amp; cats</p>
          <h2 className="mt-2 max-w-2xl text-stone-900 dark:text-stone-50 text-3xl font-bold tracking-tight md:text-4xl">
            They give you everything. Give them a plan that never forgets.
          </h2>
        </ScrollReveal>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {species.map((s, i) => (
            <ScrollReveal key={s.label} direction={s.direction} delay={i * 0.08}>
              <SpeciesCard s={s} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
