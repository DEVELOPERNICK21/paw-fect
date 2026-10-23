import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  applyHomeVisit,
  EMPTY_MASCOT_MEMORY,
  parseMascotMemory,
  type HomeGreeting,
  type MascotMemory,
} from '../domain/mascot/mascotPresence';

interface State extends MascotMemory {
  /** A Home visit happened (and produced `greeting`, or nothing): remember it. */
  recordHomeVisit: (greeting: HomeGreeting | null, now: Date) => void;
  reset: () => void;
}

const snapshot = (state: MascotMemory): MascotMemory => ({
  lastOpenedAt: state.lastOpenedAt,
  lastGreetedYmd: state.lastGreetedYmd,
  lastBirthdayYear: state.lastBirthdayYear,
});

/**
 * What the companion remembers about the user: when they last came, when it last said hello,
 * which birthday it has already celebrated. On this device only, a few bytes.
 */
export const useMascotMemoryStore = create<State>()(
  persist(
    (set, get) => ({
      ...EMPTY_MASCOT_MEMORY,
      recordHomeVisit: (greeting, now) => set(applyHomeVisit(snapshot(get()), greeting, now)),
      reset: () => set({ ...EMPTY_MASCOT_MEMORY }),
    }),
    {
      name: 'pawfect-mascot-memory',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => snapshot(state),
      // Whatever is on disk is reduced to a valid memory, so corrupt storage can never break Home.
      merge: (persisted, current) => ({ ...current, ...parseMascotMemory(persisted) }),
    },
  ),
);
