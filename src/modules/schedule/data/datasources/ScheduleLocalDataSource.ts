import type { PetSchedulePreferences } from '../../domain/models/PetProfile';
import type { ScheduleCompletionRecord } from '../../domain/repositories/ScheduleRepository';
import { storageService } from '../../../../infrastructure/storage/storageService';

const PREFERENCES_KEY = 'schedule_preferences';
const BLOCK_STATES_KEY = 'schedule_block_states';
const DAILY_SCORES_KEY = 'schedule_daily_scores';

type PreferencesMap = Record<string, Record<string, PetSchedulePreferences>>;
type BlockStatesMap = Record<string, Record<string, ScheduleCompletionRecord>>;
type DailyScoresMap = Record<string, Record<string, number>>;

function scopedKey(userId: string, petId: string, date?: string): string {
  return date ? `${userId}:${petId}:${date}` : `${userId}:${petId}`;
}

export interface ScheduleLocalDataSource {
  getPreferences(userId: string, petId: string): Promise<PetSchedulePreferences | null>;
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
  getDailyCompletionPercents(
    userId: string,
    petId: string,
    dates: string[],
  ): Promise<Record<string, number | null>>;
  saveDailyCompletionPercent(
    userId: string,
    petId: string,
    date: string,
    percent: number,
  ): Promise<void>;
  /** Drop scores older than retainDays for this pet. */
  pruneDailyCompletionPercents(
    userId: string,
    petId: string,
    retainDays?: number,
  ): Promise<void>;
}

class ScheduleLocalDataSourceImpl implements ScheduleLocalDataSource {
  async getPreferences(
    userId: string,
    petId: string,
  ): Promise<PetSchedulePreferences | null> {
    const map = (await storageService.getItem<PreferencesMap>(PREFERENCES_KEY)) ?? {};
    return map[userId]?.[petId] ?? null;
  }

  async savePreferences(
    userId: string,
    petId: string,
    preferences: PetSchedulePreferences,
  ): Promise<void> {
    const map = (await storageService.getItem<PreferencesMap>(PREFERENCES_KEY)) ?? {};
    map[userId] = { ...(map[userId] ?? {}), [petId]: preferences };
    await storageService.setItem(PREFERENCES_KEY, map);
  }

  async getBlockStates(
    userId: string,
    petId: string,
    date: string,
  ): Promise<Record<string, ScheduleCompletionRecord>> {
    const map = (await storageService.getItem<BlockStatesMap>(BLOCK_STATES_KEY)) ?? {};
    return map[scopedKey(userId, petId, date)] ?? {};
  }

  async saveBlockState(
    userId: string,
    petId: string,
    date: string,
    blockId: string,
    state: ScheduleCompletionRecord,
  ): Promise<void> {
    const map = (await storageService.getItem<BlockStatesMap>(BLOCK_STATES_KEY)) ?? {};
    const key = scopedKey(userId, petId, date);
    map[key] = { ...(map[key] ?? {}), [blockId]: state };
    await storageService.setItem(BLOCK_STATES_KEY, map);
  }

  async getDailyCompletionPercent(
    userId: string,
    petId: string,
    date: string,
  ): Promise<number | null> {
    const map = (await storageService.getItem<DailyScoresMap>(DAILY_SCORES_KEY)) ?? {};
    return map[scopedKey(userId, petId)]?.[date] ?? null;
  }

  async getDailyCompletionPercents(
    userId: string,
    petId: string,
    dates: string[],
  ): Promise<Record<string, number | null>> {
    const map = (await storageService.getItem<DailyScoresMap>(DAILY_SCORES_KEY)) ?? {};
    const petScores = map[scopedKey(userId, petId)] ?? {};
    const result: Record<string, number | null> = {};
    for (const date of dates) {
      result[date] = petScores[date] ?? null;
    }
    return result;
  }

  async saveDailyCompletionPercent(
    userId: string,
    petId: string,
    date: string,
    percent: number,
  ): Promise<void> {
    const map = (await storageService.getItem<DailyScoresMap>(DAILY_SCORES_KEY)) ?? {};
    const key = scopedKey(userId, petId);
    map[key] = { ...(map[key] ?? {}), [date]: percent };
    await storageService.setItem(DAILY_SCORES_KEY, map);
    await this.pruneDailyCompletionPercents(userId, petId);
  }

  async pruneDailyCompletionPercents(
    userId: string,
    petId: string,
    retainDays = 60,
  ): Promise<void> {
    const map = (await storageService.getItem<DailyScoresMap>(DAILY_SCORES_KEY)) ?? {};
    const key = scopedKey(userId, petId);
    const petScores = map[key];
    if (!petScores) {
      return;
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retainDays);
    const cutoffIso = cutoff.toISOString().slice(0, 10);
    let changed = false;
    const next: Record<string, number> = {};
    for (const [date, percent] of Object.entries(petScores)) {
      if (date >= cutoffIso) {
        next[date] = percent;
      } else {
        changed = true;
      }
    }
    if (!changed) {
      return;
    }
    map[key] = next;
    await storageService.setItem(DAILY_SCORES_KEY, map);
  }
}

export const createScheduleLocalDataSource = (): ScheduleLocalDataSource =>
  new ScheduleLocalDataSourceImpl();
