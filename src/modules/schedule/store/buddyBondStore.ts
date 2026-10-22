import { create } from 'zustand';

import {
  mmkvGetJson,
  mmkvSetJson,
} from '../../../infrastructure/storage/mmkvStorage';
import {
  bondProgress,
  levelForXp,
  xpForCompletion,
  type BondProgress,
} from '../../../shared/companion/buddyBond';
import type { CareTaskCompletedEvent } from '../domain/models/CareCompletionEvent';
import { subscribeToCareCompletions, useScheduleStore } from './scheduleStore';

const STORAGE_KEY = 'pawfect-buddy-bond-v1';
/** Remember this many recent completions so a repeat event never pays twice. */
const REMEMBERED_KEYS = 400;

interface Persisted {
  xp: number;
  awarded: string[];
}

export interface BuddyBondState {
  xp: number;
  awarded: string[];
  /** Level the user just reached and has not yet been celebrated for. */
  pendingLevelUp: number | null;
  hydrated: boolean;
  hydrate: () => void;
  awardCompletion: (event: CareTaskCompletedEvent, streakDays: number) => void;
  dismissLevelUp: () => void;
}

export const useBuddyBondStore = create<BuddyBondState>((set, get) => ({
  xp: 0,
  awarded: [],
  pendingLevelUp: null,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) {
      return;
    }
    const saved = mmkvGetJson<Persisted>(STORAGE_KEY);
    set({
      xp: Math.max(0, saved?.xp ?? 0),
      awarded: Array.isArray(saved?.awarded) ? saved.awarded : [],
      hydrated: true,
    });
  },

  awardCompletion: (event, streakDays) => {
    const key = `${event.petId}:${event.blockId}:${event.date}`;
    const { xp, awarded } = get();
    if (awarded.includes(key)) {
      return;
    }
    const gained = xpForCompletion({
      dayCompleted: event.dayCompleted,
      streakDays,
    });
    const nextXp = xp + gained;
    const nextAwarded = [...awarded, key].slice(-REMEMBERED_KEYS);
    const reached = levelForXp(nextXp);
    set({
      xp: nextXp,
      awarded: nextAwarded,
      pendingLevelUp: reached > levelForXp(xp) ? reached : get().pendingLevelUp,
    });
    mmkvSetJson<Persisted>(STORAGE_KEY, { xp: nextXp, awarded: nextAwarded });
  },

  dismissLevelUp: () => set({ pendingLevelUp: null }),
}));

export function useBondProgress(): BondProgress {
  const xp = useBuddyBondStore(s => s.xp);
  return bondProgress(xp);
}

let started = false;

/**
 * Starts earning bond points from care completions for the life of the app.
 * Idempotent. Call once at startup (not from a screen: a tab that never mounted
 * would miss completions made from Home).
 */
export function startBuddyBond(): () => void {
  useBuddyBondStore.getState().hydrate();
  if (started) {
    return () => undefined;
  }
  started = true;
  const off = subscribeToCareCompletions(event => {
    useBuddyBondStore
      .getState()
      .awardCompletion(event, useScheduleStore.getState().careStreakDays);
  });
  return () => {
    off();
    started = false;
  };
}
