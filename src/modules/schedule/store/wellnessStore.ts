import { create } from 'zustand';

import { ensureNotificationsReady } from '../../../infrastructure/notifications/notificationDiagnostics';
import { notificationService } from '../../../infrastructure/notifications/notificationService';
import { getAppSessionUserId } from '../../../shared/session/appSessionPorts';
import { getTodayIsoDateLocal } from '../../../shared/utils/calendarDate';
import { syncWellnessDigestNotifications } from '../data/notifications/wellnessDigestNotificationSync';
import type { DailyCareBlock } from '../domain/models/DailyCareBlock';
import type { DayCompletion } from '../domain/utils/wellnessCompletion';
import {
  getDayCompletion,
  isDayFullyComplete,
} from '../domain/utils/wellnessCompletion';
import {
  enrichWellnessBlocks,
  resolveHeroBlockId,
  resolveUpNextBlocks,
} from '../domain/utils/enrichWellnessBlocks';
import { scheduleComposition } from '../scheduleComposition';

function shiftIsoDate(date: string, deltaDays: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(year, (month ?? 1) - 1, day ?? 1);
  next.setDate(next.getDate() + deltaDays);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
}

function parseTimeMinutes(time24: string): number {
  const [hours, minutes] = time24.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function isPastOwnerSleep(ownerSleepTime: string, now: Date): boolean {
  return now.getHours() * 60 + now.getMinutes() > parseTimeMinutes(ownerSleepTime);
}

function stripEnrichment(block: DailyCareBlock): DailyCareBlock {
  const rest = { ...block };
  delete rest.status;
  delete rest.isProFeature;
  delete rest.insightTip;
  delete rest.isMissed;
  return rest;
}

export interface HydrateDayInput {
  petId: string;
  petName: string;
  species: 'dog' | 'cat';
  blocks: DailyCareBlock[];
  date: string;
  isPro: boolean;
  ownerSleepTime: string;
}

export interface WellnessState {
  rawBlocks: DailyCareBlock[];
  enrichedBlocks: DailyCareBlock[];
  completion: DayCompletion;
  streakDays: number;
  relaxedMode: boolean;
  heroBlockId: string | null;
  upNextBlocks: DailyCareBlock[];
  showCelebration: boolean;
  celebrationPetName: string | null;
  selectedBlockId: string | null;
  petId: string | null;
  date: string | null;
  isPro: boolean;
  ownerSleepTime: string;
  petName: string;
  species: 'dog' | 'cat';
  reset: () => void;
  hydrateDay: (input: HydrateDayInput) => Promise<void>;
  markTaskDone: (petId: string, blockId: string, date: string) => Promise<void>;
  skipTask: (petId: string, blockId: string, date: string) => Promise<void>;
  getDayCompletionForPet: (petId: string, date: string) => DayCompletion;
  checkAndUpdateStreak: (
    petId: string,
    date: string,
    ownerSleepTime: string,
  ) => void;
  setRelaxedMode: (userId: string, enabled: boolean) => Promise<void>;
  loadRelaxedMode: (userId: string) => void;
  setSelectedBlockId: (blockId: string | null) => void;
  clearCelebration: () => void;
}

const initialCompletion: DayCompletion = { done: 0, total: 0, percentage: 0 };

export const useWellnessStore = create<WellnessState>((set, get) => ({
  rawBlocks: [],
  enrichedBlocks: [],
  completion: initialCompletion,
  streakDays: 0,
  relaxedMode: false,
  heroBlockId: null,
  upNextBlocks: [],
  showCelebration: false,
  celebrationPetName: null,
  selectedBlockId: null,
  petId: null,
  date: null,
  isPro: false,
  ownerSleepTime: '22:30',
  petName: '',
  species: 'dog',

  reset: () =>
    set({
      rawBlocks: [],
      enrichedBlocks: [],
      completion: initialCompletion,
      streakDays: 0,
      heroBlockId: null,
      upNextBlocks: [],
      showCelebration: false,
      celebrationPetName: null,
      selectedBlockId: null,
      petId: null,
      date: null,
    }),

  hydrateDay: async input => {
    const userId = getAppSessionUserId();
    const today = getTodayIsoDateLocal();
    const now = new Date();
    const relaxedMode =
      userId != null ? scheduleComposition.getRelaxedMode(userId) : false;
    const rawBlocks = input.blocks.map(stripEnrichment);

    let taskMap = scheduleComposition.getWellnessTasks(
      input.petId,
      input.date,
      today,
    );
    if (userId != null && Object.keys(taskMap).length === 0) {
      const blockStates = await scheduleComposition.getBlockStates(
        userId,
        input.petId,
        input.date,
      );
      taskMap = scheduleComposition.seedWellnessTasksFromBlockStates(
        input.petId,
        input.date,
        blockStates,
        today,
      );
    }

    const enriched = enrichWellnessBlocks({
      blocks: rawBlocks,
      species: input.species,
      taskMap,
      now,
      relaxedMode,
    });
    const completion = getDayCompletion(enriched, input.isPro);
    const heroBlockId = resolveHeroBlockId(enriched);
    const upNextBlocks = resolveUpNextBlocks(enriched, heroBlockId);
    const streak = scheduleComposition.getWellnessStreak(input.petId);

    set({
      rawBlocks,
      enrichedBlocks: enriched,
      completion,
      streakDays: streak.count,
      relaxedMode,
      heroBlockId,
      upNextBlocks,
      petId: input.petId,
      date: input.date,
      isPro: input.isPro,
      ownerSleepTime: input.ownerSleepTime,
      petName: input.petName,
      species: input.species,
    });

    get().checkAndUpdateStreak(input.petId, input.date, input.ownerSleepTime);

    void (async () => {
      const granted = await ensureNotificationsReady();
      if (!granted) {
        return;
      }
      await syncWellnessDigestNotifications(
        input.date,
        input.petId,
        input.petName,
        enriched,
        notificationService,
      );
    })();
  },

  markTaskDone: async (petId, blockId, date) => {
    const userId = getAppSessionUserId();
    const today = getTodayIsoDateLocal();
    const state = get();

    scheduleComposition.saveWellnessTask(petId, date, blockId, 'done', today);

    if (userId != null) {
      await scheduleComposition.markCareBlockDone.execute({
        userId,
        petId,
        date,
        blockId,
        completed: true,
      });
    }

    const updatedRaw = state.rawBlocks.map(block =>
      block.id === blockId
        ? { ...block, isCompleted: true, completedAt: new Date().toISOString() }
        : block,
    );

    await get().hydrateDay({
      petId,
      petName: state.petName,
      species: state.species,
      blocks: updatedRaw,
      date,
      isPro: state.isPro,
      ownerSleepTime: state.ownerSleepTime,
    });

    const { completion, petName } = get();
    if (isDayFullyComplete(completion)) {
      get().checkAndUpdateStreak(petId, date, state.ownerSleepTime);
      set({ showCelebration: true, celebrationPetName: petName });
    }
  },

  skipTask: async (petId, blockId, date) => {
    const today = getTodayIsoDateLocal();
    const state = get();
    scheduleComposition.saveWellnessTask(petId, date, blockId, 'skipped', today);

    await get().hydrateDay({
      petId,
      petName: state.petName,
      species: state.species,
      blocks: state.rawBlocks,
      date,
      isPro: state.isPro,
      ownerSleepTime: state.ownerSleepTime,
    });
  },

  getDayCompletionForPet: (_petId, _date) => {
    const { enrichedBlocks, isPro } = get();
    return getDayCompletion(enrichedBlocks, isPro);
  },

  checkAndUpdateStreak: (petId, date, ownerSleepTime) => {
    const { completion } = get();
    const streak = scheduleComposition.getWellnessStreak(petId);
    const now = new Date();

    if (isDayFullyComplete(completion)) {
      const last = streak.lastCompletedDate;
      const yesterday = shiftIsoDate(date, -1);
      let nextCount = 1;
      if (last === date) {
        nextCount = streak.count;
      } else if (last === yesterday) {
        nextCount = streak.count + 1;
      }
      scheduleComposition.saveWellnessStreak(petId, {
        count: nextCount,
        lastCompletedDate: date,
      });
      set({ streakDays: nextCount });
      return;
    }

    if (isPastOwnerSleep(ownerSleepTime, now)) {
      scheduleComposition.saveWellnessStreak(petId, {
        count: 0,
        lastCompletedDate: streak.lastCompletedDate,
      });
      set({ streakDays: 0 });
    }
  },

  setRelaxedMode: async (userId, enabled) => {
    scheduleComposition.setRelaxedMode(userId, enabled);
    set({ relaxedMode: enabled });
    const state = get();
    if (state.petId && state.date) {
      await get().hydrateDay({
        petId: state.petId,
        petName: state.petName,
        species: state.species,
        blocks: state.rawBlocks,
        date: state.date,
        isPro: state.isPro,
        ownerSleepTime: state.ownerSleepTime,
      });
    }
  },

  loadRelaxedMode: userId => {
    set({ relaxedMode: scheduleComposition.getRelaxedMode(userId) });
  },

  setSelectedBlockId: blockId => set({ selectedBlockId: blockId }),

  clearCelebration: () => set({ showCelebration: false, celebrationPetName: null }),
}));
