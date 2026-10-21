"use client";

import type { FaqItem } from "@/types";
import { useState } from "react";

export function PricingFaq({
  items,
  heading = "Questions before you subscribe?",
  subheading = "Straight answers. Tap to expand.",
}: {
  items: FaqItem[];
  heading?: string;
  subheading?: string;
}): React.ReactElement {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  return (
    <section className="mt-20 md:mt-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-stone-900 dark:text-stone-50 text-3xl font-bold tracking-tight md:text-4xl">{heading}</h2>
        <p className="mt-3 text-stone-600 dark:text-stone-400">
          {subheading}
        </p>
      </div>
      <div className="mx-auto mt-10 max-w-3xl space-y-3">
        {items.map((item) => {
          const isOpen = open === item.id;
          return (
            <div
              key={item.id}
              className={`overflow-hidden rounded-2xl border transition ${
                isOpen
                  ? "border-primary/40 bg-primary/5 shadow-md dark:border-primary/30 dark:bg-primary/10"
                  : "border-stone-200/60 bg-surface hover:border-stone-300/60 dark:border-stone-700/50 dark:bg-stone-900/40"
              }`}
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-stone-900 dark:text-stone-100 md:text-base"
                onClick={() => setOpen(isOpen ? null : item.id)}
                aria-expanded={isOpen}
              >
                {item.question}
                <span className="shrink-0 text-lg text-primary">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen ? (
                <div className="border-t border-stone-200/80 px-5 pb-4 pt-0 text-sm leading-relaxed text-stone-600 dark:border-stone-700/50 dark:text-stone-400">
                  {item.answer}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
