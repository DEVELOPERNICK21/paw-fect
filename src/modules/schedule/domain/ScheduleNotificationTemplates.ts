import type { CareCategory } from './models/DailyCareBlock';

export const NOTIFICATION_TEMPLATES: Record<
  CareCategory,
  (petName: string, detail?: string) => { title: string; body: string }
> = {
  feeding: (name, detail) => ({
    title: `${name}'s Meal Time 🍽️`,
    body: detail ?? `Time for ${name}'s meal — fresh water too!`,
  }),
  walk: (name, detail) => ({
    title: `${name}'s Walk Time 🐾`,
    body: detail ?? `Time for a walk — let ${name} sniff and explore!`,
  }),
  play: (name, detail) => ({
    title: `Playtime for ${name} 🎾`,
    body: detail ?? `5–10 min of play — then meal time!`,
  }),
  potty: name => ({
    title: `${name}'s Potty Break`,
    body: `Quick potty break for ${name}`,
  }),
  grooming: (name, detail) => ({
    title: `${name}'s Grooming Time 🧴`,
    body: detail ?? `Brushing + quick health check for ${name}`,
  }),
  training: name => ({
    title: `Training Time for ${name} 🎓`,
    body: `5 min commands + use reserved kibble as treats`,
  }),
  health_check: (name, detail) => ({
    title: `${name}'s Health Check 🩺`,
    body: detail ?? `Quick check: eyes, ears, coat, energy`,
  }),
  litter: name => ({
    title: `${name}'s Litter Box 🧹`,
    body: `Scoop ${name}'s litter box — cats refuse dirty litter`,
  }),
  rest: name => ({
    title: `Rest Time for ${name} 😴`,
    body: `Leave ${name} undisturbed — rest is essential`,
  }),
  medication: (name, detail) => ({
    title: `${name}'s Medication 💊`,
    body: detail ?? `Time for ${name}'s medication`,
  }),
  bedtime: name => ({
    title: `Bedtime for ${name} 🌙`,
    body: `Last potty break done? Lights out for ${name}`,
  }),
};
