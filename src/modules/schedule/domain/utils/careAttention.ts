import type { MascotReaction } from '../../../../shared/components/Mascot/mascotTypes';
import type { CareAggregatedItem } from './careAggregator';

/**
 * Which mascot reaction an overdue care task deserves: calm and attentive, never distressed.
 * Pure: no React, no animation code.
 */
export function mascotReactionForOverdue(): MascotReaction {
  return 'attention';
}

const SEP = '|';

/** Stable identity of each overdue task today: day, pet and task. Sorted, so order never matters. */
export function overdueAttentionKeys(
  items: readonly Pick<CareAggregatedItem, 'urgency' | 'pet' | 'block'>[],
  date: string,
): string[] {
  return items
    .filter(item => item.urgency === 'overdue')
    .map(item => [date, item.pet.id, item.block.id].join(SEP))
    .sort();
}

export interface OverdueAttentionTracker {
  /**
   * Feed the overdue tasks currently showing. Returns `true` only if at least one of them has
   * not been announced before; every key seen is remembered. Overdue tasks that went away,
   * stayed, or reappeared do not announce again.
   */
  observe: (keys: readonly string[]) => boolean;
  reset: () => void;
}

/**
 * Remembers which overdue tasks the mascot has already looked up for, so it reacts when
 * something *newly* needs attention rather than on every render or refresh. A new day starts
 * fresh (keys include the date and older days are forgotten).
 */
export function createOverdueAttentionTracker(): OverdueAttentionTracker {
  let announced = new Set<string>();

  return {
    observe: keys => {
      if (keys.length === 0) {
        return false;
      }
      const day = keys[0].split(SEP)[0];
      announced = new Set([...announced].filter(key => key.startsWith(day + SEP)));
      let fresh = false;
      for (const key of keys) {
        if (!announced.has(key)) {
          fresh = true;
          announced.add(key);
        }
      }
      return fresh;
    },
    reset: () => {
      announced = new Set();
    },
  };
}
