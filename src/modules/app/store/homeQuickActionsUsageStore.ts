import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Identifiers for home quick actions (usage-ranked).
 */
export type HomeQuickActionId =
  | 'log_weight'
  | 'alerts'
  | 'pet_profile'
  | 'user_profile'
  | 'pet_switcher';

const DEFAULT_ORDER: HomeQuickActionId[] = [
  'log_weight',
  'alerts',
  'pet_profile',
  'user_profile',
  'pet_switcher',
];

/**
 * Sort pool by tap count (desc), then default order for ties.
 */
export function rankHomeQuickActions(
  pool: HomeQuickActionId[],
  counts: Record<string, number>,
): HomeQuickActionId[] {
  return [...pool].sort((a, b) => {
    const diff = (counts[b] ?? 0) - (counts[a] ?? 0);
    if (diff !== 0) {
      return diff;
    }
    return DEFAULT_ORDER.indexOf(a) - DEFAULT_ORDER.indexOf(b);
  });
}

interface State {
  counts: Record<string, number>;
  recordTap: (id: HomeQuickActionId) => void;
  reset: () => void;
}

export const useHomeQuickActionsUsageStore = create<State>()(
  persist(
    set => ({
      counts: {},

      recordTap: id => {
        set(state => ({
          counts: {
            ...state.counts,
            [id]: (state.counts[id] ?? 0) + 1,
          },
        }));
      },

      reset: () => {
        set({ counts: {} });
      },
    }),
    {
      name: 'pawfect-home-quick-actions-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ counts: state.counts }),
    },
  ),
);
