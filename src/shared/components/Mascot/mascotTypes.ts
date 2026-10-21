/**
 * Mascot vocabulary shared by every screen. Keep this list small and stable:
 * the placeholder SVG art and the future Rive/Lottie rig both key off it.
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
