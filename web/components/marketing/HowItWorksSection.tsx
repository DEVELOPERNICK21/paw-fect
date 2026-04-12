"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { UserPlus, Bell, Heart } from "lucide-react";

const steps = [
  {
    n: 1,
    icon: UserPlus,
    title: "Add your pet",
    body:
      "Enter name, species, date of birth, and lifestyle. Pawfect builds your pet's health plan instantly.",
  },
  {
    n: 2,
    icon: Bell,
    title: "Follow the schedule",
    body:
      "Get notified for vaccines, deworming, and milestones. Mark done in one tap — we recover the plan if you're late.",
  },
  {
    n: 3,
    icon: Heart,
    title: "Watch them thrive",
    body: "Track completed milestones, view full history, and share records with your vet in one tap.",
  },
];

export function HowItWorksSection(): React.ReactElement {
  return (
    <section id="how-it-works" className="bg-stone-50 py-24 dark:bg-stone-900/50 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <h2 className="text-center text-3xl font-bold text-stone-900 dark:text-stone-50 md:text-4xl">
            Three steps to a healthier pet
          </h2>
        </AnimatedSection>
        <div className="mt-16 grid gap-10 md:grid-cols-3">
          {steps.map((s, idx) => (
            <div key={s.n} className="relative">
              {idx < steps.length - 1 ? (
                <div
                  className="absolute left-1/2 top-12 hidden h-px w-full bg-stone-200 md:block dark:bg-stone-600"
                  style={{ width: "calc(100% - 2rem)", transform: "translateX(50%)" }}
                  aria-hidden
                />
              ) : null}
              <div className="relative flex flex-col items-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-white dark:text-stone-900">
                  {s.n}
                </span>
                <s.icon className="mt-6 h-8 w-8 text-primary" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold text-stone-900 dark:text-stone-100">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
