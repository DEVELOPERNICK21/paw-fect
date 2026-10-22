/**
 * Mascot vocabulary shared by every screen. Keep this list small and stable:
 * the Rive file's view model (`docs/mascot/rive-spec.md`) keys off the moods and reactions.
 */
export type MascotSpecies = 'dog' | 'cat';

export type MascotMood =
  /** Greeting / default friendly face. */
  | 'happy'
  /** Waving hello (home greeting, welcome). */
  | 'wave'
  /** Something is coming up soon — head tilt, raised brow. */
  | 'curious'
  /** Gentle "let's sort this together" — never sad, never scolding. */
  | 'nudge'
  /** Working on something (plan being built). */
  | 'thinking'
  /** Everything for today is done. */
  | 'proud'
  /** Milestone reached. */
  | 'celebrating'
  /** Nothing to do / late at night. */
  | 'sleepy';

/**
 * One-shot reactions layered on top of the current mood. Each maps 1:1 to a
 * trigger property on the Rive file's `Mascot` view model (see
 * `docs/mascot/rive-spec.md`); the mascot returns to its mood by itself.
 */
export type MascotReaction =
  /** Tapped / stroked: head tilt, happy face, short tail wag. */
  | 'pet'
  /** A pet profile was just created: small bounce + friendly wag. */
  | 'welcome'
  /** A care task was completed: happy bounce + tail wag. */
  | 'success'
  /** Every care task for the period is done: short celebration. */
  | 'celebrate'
  /** Something to look at (e.g. opening a health record): gentle head tilt. */
  | 'curious'
  /** An overdue reminder: calm, attentive look. Never distressed. */
  | 'attention';

export const MASCOT_REACTIONS: readonly MascotReaction[] = [
  'pet',
  'welcome',
  'success',
  'celebrate',
  'curious',
  'attention',
];

/**
 * Declarative "play this once" request, for reactions that may be asked for before the
 * mascot is loaded or visible (e.g. a screen that is mounted but not yet focused).
 */
export interface MascotReactionRequest {
  reaction: MascotReaction;
  /** Each distinct `id` plays at most once. Change it to ask again; re-renders never replay. */
  id: string | number;
  /**
   * How long the request may wait for the mascot to become ready and visible before it
   * is dropped as stale. Default 6000 ms.
   */
  ttlMs?: number;
}

/** Imperative handle exposed by `<Mascot ref={...} />`. */
export interface MascotHandle {
  /**
   * Ask the mascot to play a reaction. Returns `true` only if it actually
   * started: `false` when the animation is not ready, the mascot is paused or
   * hidden, the still image is showing, or a reaction of equal or
   * higher priority is already playing (so repeated calls never restart it).
   */
  react: (reaction: MascotReaction) => boolean;
}

export const MASCOT_MOODS: readonly MascotMood[] = [
  'happy',
  'wave',
  'curious',
  'nudge',
  'thinking',
  'proud',
  'celebrating',
  'sleepy',
];
