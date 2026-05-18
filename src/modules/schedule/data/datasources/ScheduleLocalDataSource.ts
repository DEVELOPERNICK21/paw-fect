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
  saveDailyCompletionPercent(
    userId: string,
    petId: string,
    date: string,
    percent: number,
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
  }
}

export const createScheduleLocalDataSource = (): ScheduleLocalDataSource =>
  new ScheduleLocalDataSourceImpl();
