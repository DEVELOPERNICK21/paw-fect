import type { CareCategory } from './models/DailyCareBlock';

export const NOTIFICATION_TEMPLATES: Record<
  CareCategory,
  (petName: string, detail?: string) => { title: string; body: string }
> = {
  feeding: (name, detail) => ({
    title: `${name} needs a meal`,
    body: detail ?? `It's time to feed ${name}.`,
  }),
  walk: (name, detail) => ({
    title: `${name} needs a walk`,
    body: detail ?? `It's time for ${name}'s walk.`,
  }),
  play: (name, detail) => ({
    title: `Play with ${name}`,
    body: detail ?? `A short play session will help ${name}.`,
  }),
  potty: name => ({
    title: `${name} needs a potty break`,
    body: `Quick potty break for ${name}.`,
  }),
  grooming: (name, detail) => ({
    title: `Groom ${name}`,
    body: detail ?? `Brushing and a quick check for ${name}.`,
  }),
  training: name => ({
    title: `Train ${name}`,
    body: `A few minutes of training with ${name}.`,
  }),
  health_check: (name, detail) => ({
    title: `Check on ${name}`,
    body: detail ?? `Quick look: eyes, ears, coat, energy.`,
  }),
  litter: name => ({
    title: `Scoop ${name}'s litter`,
    body: `Scoop the litter box for ${name}.`,
  }),
  rest: name => ({
    title: `Rest time for ${name}`,
    body: `Give ${name} quiet time to rest.`,
  }),
  medication: (name, detail) => ({
    title: `${name}'s medicine`,
    body: detail ?? `Time for ${name}'s medicine.`,
  }),
  bedtime: name => ({
    title: `Bedtime for ${name}`,
    body: `Help ${name} wind down for the night.`,
  }),
};
