"use client";

import Image from "next/image";
import speciesDog from "@/app/assets/Images/species-dog.png";
import speciesCat from "@/app/assets/Images/species-cat.png";
import { ScrollReveal } from "@/components/marketing/ScrollEffects";

const species = [
  {
    title: "Dogs",
    image: speciesDog,
    alt: "Golden retriever outdoors in soft morning light",
    points: [
      "Puppy DP, DHPPiL schedules",
      "Bordetella & Lyme where relevant",
      "Lifestyle-based risk adjustments",
    ],
    direction: "left" as const,
  },
  {
    title: "Cats",
    image: speciesCat,
    alt: "Domestic cat on a sunny windowsill",
    points: [
      "FVRCP & Rabies cadence",
      "FeLV for at-risk cats",
      "Indoor vs outdoor protocols",
    ],
    direction: "right" as const,
  },
];

export function SpeciesSection(): React.ReactElement {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="max-w-2xl text-3xl font-bold text-stone-900 dark:text-stone-50 md:text-4xl">
            Built for dogs. Built for cats.
          </h2>
        </ScrollReveal>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {species.map((s, i) => (
            <ScrollReveal key={s.title} direction={s.direction} delay={i * 0.08}>
              <article className="overflow-hidden rounded-2xl border border-stone-200/90 bg-surface shadow-card dark:border-stone-700 dark:bg-stone-800/40">
                <div className="relative aspect-[4/3] w-full bg-stone-100 dark:bg-stone-900">
                  <Image
                    src={s.image}
                    alt={s.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50">{s.title}</h3>
                  <ul className="mt-4 space-y-2 text-stone-600 dark:text-stone-400">
                    {s.points.map((point) => (
                      <li key={point} className="flex gap-2 text-sm leading-relaxed">
                        <span className="text-primary" aria-hidden>
                          ✓
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
