import type { PetSchedulePreferences } from '../models/PetProfile';
import type {
  PersistedWellnessTaskStatus,
  WellnessStreakRecord,
  WellnessTaskMap,
} from '../models/WellnessTask';

export interface ScheduleCompletionRecord {
  completedAt: string | null;
  snoozedUntil: string | null;
}

export interface ScheduleRepository {
  getPreferences(
    userId: string,
    petId: string,
  ): Promise<PetSchedulePreferences | null>;
  savePreferences(
    userId: string,
    petId: string,
    preferences: PetSchedulePreferences,
  ): Promise<void>;
  getBlockStates(
    userId: string,
    petId: string,
    date: string,
  ): Promise<Record<string, ScheduleCompletionRecord>>;
  saveBlockState(
    userId: string,
    petId: string,
    date: string,
    blockId: string,
    state: ScheduleCompletionRecord,
  ): Promise<void>;
  getDailyCompletionPercent(
    userId: string,
    petId: string,
    date: string,
  ): Promise<number | null>;
  saveDailyCompletionPercent(
    userId: string,
    petId: string,
    date: string,
    percent: number,
  ): Promise<void>;
  /** Wellness MMKV streak — single source of truth for care streaks. */
  getCareStreakDays(petId: string): number;
  getWellnessTasks(petId: string, date: string, today: string): WellnessTaskMap;
  saveWellnessTask(
    petId: string,
    date: string,
    blockId: string,
    status: PersistedWellnessTaskStatus,
    today: string,
  ): void;
  seedWellnessTasksFromBlockStates(
    petId: string,
    date: string,
    blockStates: Record<string, ScheduleCompletionRecord>,
    today: string,
  ): WellnessTaskMap;
  getWellnessStreak(petId: string): WellnessStreakRecord;
  saveWellnessStreak(petId: string, record: WellnessStreakRecord): void;
  getRelaxedMode(userId: string): boolean;
  setRelaxedMode(userId: string, enabled: boolean): void;
  /**
   * Returns completion percents for many dates with one storage read when possible.
   */
  getDailyCompletionPercents(
    userId: string,
    petId: string,
    dates: string[],
  ): Promise<Record<string, number | null>>;
}
