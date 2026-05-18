import { Card } from "@/components/ui/Card";
import type { Testimonial } from "@/types";
import { Star } from "lucide-react";

export function TestimonialsSection({ items }: { items: Testimonial[] }): React.ReactElement | null {
  if (items.length === 0) {
    return null;
  }
  return (
    <section className="relative overflow-hidden bg-paw-pattern py-24 dark:bg-stone-900/30 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
            Real stories
          </p>
          <h2 className="mt-3 text-3xl font-bold text-stone-900 dark:text-stone-50 md:text-4xl">Loved by pet parents</h2>
          <p className="mx-auto mt-4 max-w-xl text-stone-600 dark:text-stone-400">
            Schedules that stick — even on busy weeks.
          </p>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {items.map((t) => (
            <Card key={t.id} className="relative overflow-hidden">
              <span
                className="pointer-events-none absolute right-3 top-2 font-serif text-6xl leading-none text-primary/15"
                aria-hidden
              >
                &ldquo;
              </span>
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-accent/10 text-sm font-bold text-primary-dark dark:text-primary">
                  {t.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")}
                </div>
                <p className="mt-4 text-sm font-semibold text-stone-900 dark:text-stone-100">{t.name}</p>
                <p className="text-xs text-stone-500">
                  {t.petName} · {t.species}
                </p>
                <div className="mt-2 flex gap-0.5" aria-label={`${t.stars} stars`}>
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" aria-hidden />
                  ))}
                </div>
                <p className="mt-5 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
