import { create } from 'zustand';

import { getAppSessionPlan, getAppSessionUserId } from '../../../shared/session/appSessionPorts';
import { getTodayIsoDateLocal } from '../../../shared/utils/calendarDate';
import type { DailySchedule } from '../domain/models/DailySchedule';
import type { PetSchedulePreferences } from '../domain/models/PetProfile';
import { isScheduleProUser } from '../domain/models/ScheduleFeatureGates';
import {
  getDayCompletion,
  isDayFullyComplete,
} from '../domain/utils/wellnessCompletion';
import { scheduleComposition } from '../scheduleComposition';

function shiftIsoDate(date: string, deltaDays: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(year, (month ?? 1) - 1, day ?? 1);
  next.setDate(next.getDate() + deltaDays);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
}

export interface ScheduleState {
  schedule: DailySchedule | null;
  /** All-pets Care hub schedules for today (SSOT blocks per pet). */
  careSchedulesByPetId: Record<string, DailySchedule>;
  /** Care filter: all pets or one pet id. */
  careFilterPetId: 'all' | string;
  preferences: PetSchedulePreferences | null;
  loading: boolean;
  careLoading: boolean;
  error: string | null;
  selectedBlockId: string | null;
  weekScores: Array<{ date: string; percent: number }>;
  /** Display streak for Care hub (filtered pet or best across all). */
  careStreakDays: number;
  reset: () => void;
  loadDaySchedule: (
    petId: string,
    date?: string,
    options?: { skipNotificationSync?: boolean },
  ) => Promise<void>;
  loadCareDaySchedules: (
    petIds: string[],
    date?: string,
  ) => Promise<void>;
  setCareFilterPetId: (petId: 'all' | string) => void;
  refreshCareStreak: (
    petIds: string[],
    filterPetId?: 'all' | string,
  ) => void;
  /** Persist streak when a pet's day hits 100%. Returns updated streak count. */
  bumpCareStreakIfDayComplete: (
    petId: string,
    date: string,
    isPro: boolean,
  ) => number;
  loadPreferences: (petId: string) => Promise<void>;
  savePreferences: (
    petId: string,
    preferences: PetSchedulePreferences,
  ) => Promise<void>;
  markBlockDone: (blockId: string, completed: boolean) => Promise<void>;
  markCareBlockDone: (
    petId: string,
    blockId: string,
    completed: boolean,
  ) => Promise<void>;
  skipBlock: (blockId: string) => Promise<void>;
  skipCareBlock: (petId: string, blockId: string) => Promise<void>;
  snoozeBlock: (blockId: string, minutes: number) => Promise<void>;
  snoozeCareBlock: (
    petId: string,
    blockId: string,
    minutes: number,
  ) => Promise<void>;
  setSelectedBlockId: (blockId: string | null) => void;
  loadWeekScores: (petId: string) => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedule: null,
  careSchedulesByPetId: {},
  careFilterPetId: 'all',
  preferences: null,
  loading: false,
  careLoading: false,
  error: null,
  selectedBlockId: null,
  weekScores: [],
  careStreakDays: 0,
  reset: () =>
    set({
      schedule: null,
      careSchedulesByPetId: {},
      careFilterPetId: 'all',
      preferences: null,
      loading: false,
      careLoading: false,
      error: null,
      selectedBlockId: null,
      weekScores: [],
      careStreakDays: 0,
    }),

  setCareFilterPetId: petId => {
    set({ careFilterPetId: petId });
    const petIds = Object.keys(get().careSchedulesByPetId);
    if (petIds.length > 0) {
      get().refreshCareStreak(petIds, petId);
    }
  },

  refreshCareStreak: (petIds, filterPetId = get().careFilterPetId) => {
    if (petIds.length === 0) {
      set({ careStreakDays: 0 });
      return;
    }
    if (filterPetId !== 'all') {
      set({
        careStreakDays:
          scheduleComposition.getWellnessStreak(filterPetId).count,
      });
      return;
    }
    const best = petIds.reduce((max, id) => {
      const count = scheduleComposition.getWellnessStreak(id).count;
      return count > max ? count : max;
    }, 0);
    set({ careStreakDays: best });
  },

  bumpCareStreakIfDayComplete: (petId, date, isPro) => {
    const schedule = get().careSchedulesByPetId[petId] ?? get().schedule;
    if (!schedule || schedule.petId !== petId) {
      return get().careStreakDays;
    }
    const completion = getDayCompletion(schedule.blocks, isPro);
    if (!isDayFullyComplete(completion)) {
      return get().careStreakDays;
    }
    const streak = scheduleComposition.getWellnessStreak(petId);
    const yesterday = shiftIsoDate(date, -1);
    let nextCount = 1;
    if (streak.lastCompletedDate === date) {
      nextCount = streak.count;
    } else if (streak.lastCompletedDate === yesterday) {
      nextCount = streak.count + 1;
    }
    scheduleComposition.saveWellnessStreak(petId, {
      count: nextCount,
      lastCompletedDate: date,
    });
    const petIds = Object.keys(get().careSchedulesByPetId);
    get().refreshCareStreak(
      petIds.length > 0 ? petIds : [petId],
      get().careFilterPetId,
    );
    return nextCount;
  },

  loadDaySchedule: async (petId, date = getTodayIsoDateLocal(), options) => {
    const userId = getAppSessionUserId();
    if (!userId) {
      set({ error: 'Please sign in again.', loading: false });
      return;
    }
    const currentSchedule = get().schedule;
    const hasCachedSchedule =
      currentSchedule != null && currentSchedule.petId === petId;
    set({ loading: !hasCachedSchedule, error: null });
    try {
      const isPro = isScheduleProUser(getAppSessionPlan());
      const schedule = await scheduleComposition.buildDailySchedule.execute({
        userId,
        petId,
        date,
        isPro,
      });
      if (!schedule) {
        set({ schedule: null, loading: false, error: 'This pet no longer exists.' });
        return;
      }
      set(state => ({
        schedule,
        loading: false,
        careSchedulesByPetId: {
          ...state.careSchedulesByPetId,
          [petId]: schedule,
        },
      }));
      if (!options?.skipNotificationSync) {
        await scheduleComposition.resyncMustFireNotifications();
      }
      await scheduleComposition.syncGlanceForSchedule(schedule);
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Unable to load schedule.',
      });
    }
  },

  loadCareDaySchedules: async (petIds, date = getTodayIsoDateLocal()) => {
    const userId = getAppSessionUserId();
    if (!userId) {
      set({ error: 'Please sign in again.', careLoading: false });
      return;
    }
    if (petIds.length === 0) {
      set({ careSchedulesByPetId: {}, careLoading: false });
      return;
    }
    set({ careLoading: true, error: null });
    try {
      const isPro = isScheduleProUser(getAppSessionPlan());
      const next: Record<string, DailySchedule> = {};
      await Promise.all(
        petIds.map(async petId => {
          const schedule = await scheduleComposition.buildDailySchedule.execute({
            userId,
            petId,
            date,
            isPro,
          });
          if (schedule) {
            next[petId] = schedule;
          }
        }),
      );
      const activeSchedule = get().schedule;
      set({
        careSchedulesByPetId: next,
        careLoading: false,
        schedule:
          activeSchedule && next[activeSchedule.petId]
            ? next[activeSchedule.petId]
            : activeSchedule,
      });
      get().refreshCareStreak(Object.keys(next));
    } catch (error) {
      set({
        careLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load care schedules.',
      });
    }
  },

  loadPreferences: async petId => {
    const userId = getAppSessionUserId();
    if (!userId) {
      return;
    }
    const preferences = await scheduleComposition.getSchedulePreferences.execute({
      userId,
      petId,
    });
    set({ preferences });
  },

  savePreferences: async (petId, preferences) => {
    const userId = getAppSessionUserId();
    if (!userId) {
      set({ error: 'Please sign in again.', loading: false });
      throw new Error('Please sign in again.');
    }
    set({ loading: true, error: null });
    try {
      await scheduleComposition.saveSchedulePreferences.execute({
        userId,
        petId,
        preferences,
      });
      set({ preferences, loading: false, error: null });
      await get().loadDaySchedule(petId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save schedule preferences.';
      set({ loading: false, error: message });
      throw error instanceof Error ? error : new Error(message);
    }
  },

  markBlockDone: async (blockId, completed) => {
    const { schedule } = get();
    if (!schedule) {
      return;
    }
    await get().markCareBlockDone(schedule.petId, blockId, completed);
  },

  markCareBlockDone: async (petId, blockId, completed) => {
    const userId = getAppSessionUserId();
    if (!userId) {
      return;
    }
    const care = get().careSchedulesByPetId[petId] ?? get().schedule;
    const date = care?.date ?? getTodayIsoDateLocal();

    const patchBlocks = (blocks: DailySchedule['blocks']): DailySchedule['blocks'] =>
      blocks.map(block =>
        block.id === blockId
          ? {
              ...block,
              isCompleted: completed,
              isSkipped: completed ? false : block.isSkipped,
              completedAt: completed ? new Date().toISOString() : null,
            }
          : block,
      );

    set(state => {
      const petSchedule = state.careSchedulesByPetId[petId];
      const nextCare = { ...state.careSchedulesByPetId };
      if (petSchedule) {
        nextCare[petId] = {
          ...petSchedule,
          blocks: patchBlocks(petSchedule.blocks),
        };
      }
      const nextSchedule =
        state.schedule?.petId === petId
          ? {
              ...state.schedule,
              blocks: patchBlocks(state.schedule.blocks),
            }
          : state.schedule;
      return {
        careSchedulesByPetId: nextCare,
        schedule: nextSchedule,
      };
    });

    await scheduleComposition.markCareBlockDone.execute({
      userId,
      petId,
      date,
      blockId,
      completed,
    });
    if (completed) {
      await scheduleComposition.cancelScheduleBlockNotification(blockId, petId);
    }
    const petIds = Object.keys(get().careSchedulesByPetId);
    if (petIds.length > 0) {
      await get().loadCareDaySchedules(petIds, date);
    } else {
      await get().loadDaySchedule(petId, date);
    }
    if (completed) {
      const isPro = isScheduleProUser(getAppSessionPlan());
      get().bumpCareStreakIfDayComplete(petId, date, isPro);
    }
  },

  skipBlock: async blockId => {
    const { schedule } = get();
    if (!schedule) {
      return;
    }
    await get().skipCareBlock(schedule.petId, blockId);
  },

  skipCareBlock: async (petId, blockId) => {
    const userId = getAppSessionUserId();
    if (!userId) {
      return;
    }
    const care = get().careSchedulesByPetId[petId] ?? get().schedule;
    const date = care?.date ?? getTodayIsoDateLocal();

    await scheduleComposition.skipCareBlock.execute({
      userId,
      petId,
      date,
      blockId,
    });
    const petIds = Object.keys(get().careSchedulesByPetId);
    if (petIds.length > 0) {
      await get().loadCareDaySchedules(petIds, date);
    } else {
      await get().loadDaySchedule(petId, date);
    }
  },

  snoozeBlock: async (blockId, minutes) => {
    const { schedule } = get();
    if (!schedule) {
      return;
    }
    await get().snoozeCareBlock(schedule.petId, blockId, minutes);
  },

  snoozeCareBlock: async (petId, blockId, minutes) => {
    const userId = getAppSessionUserId();
    if (!userId) {
      return;
    }
    const care = get().careSchedulesByPetId[petId] ?? get().schedule;
    if (!care) {
      return;
    }
    const block = care.blocks.find(item => item.id === blockId);
    if (!block) {
      return;
    }
    await scheduleComposition.snoozeCareBlock.execute({
      userId,
      petId,
      date: care.date,
      blockId,
      currentTime: block.scheduledTime,
      snoozeMinutes: minutes,
    });
    await scheduleComposition.cancelScheduleBlockNotification(blockId, petId);
    const petIds = Object.keys(get().careSchedulesByPetId);
    if (petIds.length > 0) {
      await get().loadCareDaySchedules(petIds, care.date);
    } else {
      await get().loadDaySchedule(petId, care.date);
    }
  },

  setSelectedBlockId: blockId => set({ selectedBlockId: blockId }),

  loadWeekScores: async petId => {
    const userId = getAppSessionUserId();
    if (!userId) {
      return;
    }
    const today = getTodayIsoDateLocal();
    const isPro = isScheduleProUser(getAppSessionPlan());
    // Ensure today's score is fresh, then read the week from one storage pass.
    await scheduleComposition.buildDailySchedule.execute({
      userId,
      petId,
      date: today,
      isPro,
    });
    const dates: string[] = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      dates.push(shiftIsoDate(today, -offset));
    }
    const byDate = await scheduleComposition.getDailyCompletionPercents(
      userId,
      petId,
      dates,
    );
    const weekScores = dates.map(date => ({
      date,
      percent: byDate[date] ?? 0,
    }));
    set({ weekScores });
  },
}));
