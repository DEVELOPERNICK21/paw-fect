import type { MascotReaction } from './mascotTypes';

/**
 * How long each reaction plays in `pawfect-companion.riv` (seconds x 1000). The
 * file returns to the current mood on its own after this, plus a ~0.4 s
 * crossfade. Keep in sync with `docs/mascot/rive-spec.md`.
 */
export const MASCOT_REACTION_PLAY_MS: Record<MascotReaction, number> = {
  pet: 1200,
  welcome: 1800,
  success: 1400,
  celebrate: 2600,
  curious: 1400,
  attention: 1600,
};

/** Higher wins. Equal or lower priority never interrupts a playing reaction. */
const PRIORITY: Record<MascotReaction, number> = {
  celebrate: 3,
  welcome: 2,
  success: 2,
  pet: 1,
  curious: 1,
  attention: 1,
};

export interface MascotReactionGate {
  /** `true` if the reaction may start now (and records it as playing). */
  tryStart: (reaction: MascotReaction) => boolean;
  /** The reaction currently considered playing, if any. */
  active: () => MascotReaction | null;
  reset: () => void;
}

/**
 * Throttles reactions so a flurry of taps or events does not restart the
 * animation over and over: while one is playing, only a strictly higher-priority
 * reaction (e.g. `celebrate` over `success`) may take over.
 */
export function createMascotReactionGate(
  now: () => number = Date.now,
): MascotReactionGate {
  let playing: MascotReaction | null = null;
  let until = 0;

  const active = (): MascotReaction | null => {
    if (playing != null && now() >= until) {
      playing = null;
    }
    return playing;
  };

  return {
    tryStart: reaction => {
      const current = active();
      if (current != null && PRIORITY[reaction] <= PRIORITY[current]) {
        return false;
      }
      playing = reaction;
      until = now() + MASCOT_REACTION_PLAY_MS[reaction];
      return true;
    },
    active,
    reset: () => {
      playing = null;
      until = 0;
    },
  };
}
