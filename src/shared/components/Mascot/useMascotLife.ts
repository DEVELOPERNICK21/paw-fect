import { useCallback, useEffect, useRef } from 'react';

import { createIdleLife, type Gaze, type IdleLife } from './mascotInteraction';
import type { MascotReaction } from './mascotTypes';

export interface MascotLifeOptions {
  /** On only while the character is loaded, visible, calm, and allowed to fidget. Off clears every timer. */
  enabled: boolean;
  react: (reaction: MascotReaction) => boolean;
  look: (x: number, y: number, holdMs?: number) => void;
  /** Injectable for tests. */
  createLife?: () => IdleLife;
}

/**
 * Gives an idle mascot a little life: it glances around, and now and then asks "hm?".
 * One timer at a time, none while `enabled` is false, all cleared on unmount.
 *
 * `poke()` is for "the user just touched me": it restarts the quiet period, so the
 * character never fidgets in the middle of an interaction.
 */
export function useMascotLife({ enabled, react, look, createLife }: MascotLifeOptions): { poke: () => void } {
  const reactRef = useRef(react);
  const lookRef = useRef(look);
  reactRef.current = react;
  lookRef.current = look;

  const life = useRef<IdleLife | null>(null);
  if (life.current == null) {
    life.current = (createLife ?? createIdleLife)();
  }
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const clear = useCallback((): void => {
    if (timer.current != null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const schedule = useCallback((): void => {
    clear();
    if (!enabledRef.current || life.current == null) {
      return;
    }
    const step = life.current.next();
    timer.current = setTimeout(() => {
      timer.current = null;
      if (!enabledRef.current) {
        return;
      }
      const { beat } = step;
      if (beat.kind === 'glance') {
        const gaze: Gaze = beat.gaze;
        lookRef.current(gaze.x, gaze.y, beat.holdMs);
      } else {
        reactRef.current(beat.reaction);
      }
      schedule();
    }, step.delayMs);
  }, [clear]);

  useEffect(() => {
    if (enabled) {
      life.current?.reset();
      schedule();
    } else {
      clear();
    }
    return clear;
  }, [enabled, schedule, clear]);

  const poke = useCallback((): void => {
    if (!enabledRef.current) {
      return;
    }
    life.current?.reset();
    schedule();
  }, [schedule]);

  return { poke };
}
