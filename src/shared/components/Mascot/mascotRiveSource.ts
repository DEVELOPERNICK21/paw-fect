import type { MascotSpecies } from './mascotTypes';

/**
 * Where each character's Rive file lives. `null` means "no Rive file yet": the
 * app then uses the code-drawn mascot, so nothing breaks while art is pending.
 *
 * When the animator delivers a file, drop it in `src/shared/assets/rive/` and
 * point the species at it, e.g.
 *
 *   dog: require('../../assets/rive/pawfect-puppy.riv'),
 *
 * The file must follow the contract in `docs/mascot/rive-spec.md` (view model
 * `Mascot` with `mood`, `lookX`, `lookY`, `tap`, `celebrate`, `petted`).
 */
export type MascotRiveSource = number | { uri: string } | null;

export const MASCOT_RIVE_SOURCE: Record<MascotSpecies, MascotRiveSource> = {
  dog: null,
  cat: null,
};

/** View-model property names the Rive file must expose (see rive-spec.md). */
export const RIVE_PROPS = {
  mood: 'mood',
  lookX: 'lookX',
  lookY: 'lookY',
  tap: 'tap',
  celebrate: 'celebrate',
  petted: 'petted',
} as const;
