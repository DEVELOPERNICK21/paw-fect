import { create } from 'zustand';

import { getAppSessionUserId } from '../../../shared/session/appSessionPorts';
import { getTodayIsoDateLocal } from '../../../shared/utils/calendarDate';
import type { DailyCareBlock } from '../domain/models/DailyCareBlock';
import type { DailySchedule } from '../domain/models/DailySchedule';
import type { PetSchedulePreferences } from '../domain/models/PetProfile';
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
  preferences: PetSchedulePreferences | null;
  loading: boolean;
  error: string | null;
  selectedBlockId: string | null;
  weekScores: Array<{ date: string; percent: number }>;
  reset: () => void;
  loadDaySchedule: (petId: string, date?: string) => Promise<void>;
  loadPreferences: (petId: string) => Promise<void>;
  savePreferences: (
    petId: string,
    preferences: PetSchedulePreferences,
  ) => Promise<void>;
  markBlockDone: (blockId: string, completed: boolean) => Promise<void>;
  snoozeBlock: (blockId: string, minutes: number) => Promise<void>;
  setSelectedBlockId: (blockId: string | null) => void;
  loadWeekScores: (petId: string) => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedule: null,
  preferences: null,
  loading: false,
  error: null,
  selectedBlockId: null,
  weekScores: [],
  reset: () =>
    set({
      schedule: null,
      preferences: null,
      loading: false,
      error: null,
      selectedBlockId: null,
      weekScores: [],
    }),

  loadDaySchedule: async (petId, date = getTodayIsoDateLocal()) => {
    const userId = getAppSessionUserId();
    if (!userId) {
      set({ error: 'Please sign in again.', loading: false });
      return;
    }
    set({ loading: true, error: null });
    try {
      const schedule = await scheduleComposition.buildDailySchedule.execute({
        userId,
        petId,
        date,
      });
      if (!schedule) {
        set({ schedule: null, loading: false, error: 'This pet no longer exists.' });
        return;
      }
      set({ schedule, loading: false });
      await scheduleComposition.syncScheduleNotifications(schedule, schedule.blocks);
      await scheduleComposition.syncGlanceForSchedule(schedule);
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Unable to load schedule.',
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
      return;
    }
    await scheduleComposition.saveSchedulePreferences.execute({
      userId,
      petId,
      preferences,
    });
    set({ preferences });
    await get().loadDaySchedule(petId);
  },

  markBlockDone: async (blockId, completed) => {
    const userId = getAppSessionUserId();
    const { schedule } = get();
    if (!userId || !schedule) {
      return;
    }

    const optimisticBlocks = schedule.blocks.map(block =>
      block.id === blockId
        ? {
            ...block,
            isCompleted: completed,
            completedAt: completed ? new Date().toISOString() : null,
          }
        : block,
    );
    const completedCount = optimisticBlocks.filter(block => block.isCompleted).length;
    const completionPercent =
      optimisticBlocks.length === 0
        ? 0
        : Math.round((completedCount / optimisticBlocks.length) * 100);
    set({
      schedule: {
        ...schedule,
        blocks: optimisticBlocks,
        completionPercent,
      },
    });

    await scheduleComposition.markCareBlockDone.execute({
      userId,
      petId: schedule.petId,
      date: schedule.date,
      blockId,
      completed,
    });
    if (completed) {
      await scheduleComposition.cancelScheduleBlockNotification(
        blockId,
        schedule.petId,
      );
    }
    await get().loadDaySchedule(schedule.petId, schedule.date);
  },

  snoozeBlock: async (blockId, minutes) => {
    const userId = getAppSessionUserId();
    const { schedule } = get();
    if (!userId || !schedule) {
      return;
    }
    const block = schedule.blocks.find(item => item.id === blockId);
    if (!block) {
      return;
    }
    await scheduleComposition.snoozeCareBlock.execute({
      userId,
      petId: schedule.petId,
      date: schedule.date,
      blockId,
      currentTime: block.scheduledTime,
      snoozeMinutes: minutes,
    });
    await get().loadDaySchedule(schedule.petId, schedule.date);
  },

  setSelectedBlockId: blockId => set({ selectedBlockId: blockId }),

  loadWeekScores: async petId => {
    const userId = getAppSessionUserId();
    if (!userId) {
      return;
    }
    const today = getTodayIsoDateLocal();
    const weekScores: Array<{ date: string; percent: number }> = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = shiftIsoDate(today, -offset);
      const schedule = await scheduleComposition.buildDailySchedule.execute({
        userId,
        petId,
        date,
      });
      if (schedule) {
        weekScores.push({ date, percent: schedule.completionPercent });
      }
    }
    set({ weekScores });
  },
}));
