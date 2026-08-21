import type { PetSchedulePreferences } from '../../domain/models/PetProfile';
import type {
  PersistedWellnessTaskStatus,
  WellnessStreakRecord,
  WellnessTaskMap,
} from '../../domain/models/WellnessTask';
import type {
  ScheduleCompletionRecord,
  ScheduleRepository,
} from '../../domain/repositories/ScheduleRepository';
import type { ScheduleLocalDataSource } from '../datasources/ScheduleLocalDataSource';

import { createScheduleLocalDataSource } from '../datasources/ScheduleLocalDataSource';
import {
  getRelaxedMode as readRelaxedMode,
  getWellnessStreak as readWellnessStreak,
  getWellnessTasks as readWellnessTasks,
  saveWellnessStreak as writeWellnessStreak,
  saveWellnessTask as writeWellnessTask,
  seedTasksFromBlockStates,
  setRelaxedMode as writeRelaxedMode,
} from '../datasources/WellnessMmkvDataSource';

export class ScheduleRepositoryImpl implements ScheduleRepository {
  constructor(private readonly local: ScheduleLocalDataSource) {}

  getPreferences(
    userId: string,
    petId: string,
  ): Promise<PetSchedulePreferences | null> {
    return this.local.getPreferences(userId, petId);
  }

  savePreferences(
    userId: string,
    petId: string,
    preferences: PetSchedulePreferences,
  ): Promise<void> {
    return this.local.savePreferences(userId, petId, preferences);
  }

  getBlockStates(
    userId: string,
    petId: string,
    date: string,
  ): Promise<Record<string, ScheduleCompletionRecord>> {
    return this.local.getBlockStates(userId, petId, date);
  }

  saveBlockState(
    userId: string,
    petId: string,
    date: string,
    blockId: string,
    state: ScheduleCompletionRecord,
  ): Promise<void> {
    return this.local.saveBlockState(userId, petId, date, blockId, state);
  }

  getDailyCompletionPercent(
    userId: string,
    petId: string,
    date: string,
  ): Promise<number | null> {
    return this.local.getDailyCompletionPercent(userId, petId, date);
  }

  getDailyCompletionPercents(
    userId: string,
    petId: string,
    dates: string[],
  ): Promise<Record<string, number | null>> {
    return this.local.getDailyCompletionPercents(userId, petId, dates);
  }

  saveDailyCompletionPercent(
    userId: string,
    petId: string,
    date: string,
    percent: number,
  ): Promise<void> {
    return this.local.saveDailyCompletionPercent(userId, petId, date, percent);
  }

  getCareStreakDays(petId: string): number {
    return readWellnessStreak(petId).count;
  }

  getWellnessTasks(
    petId: string,
    date: string,
    today: string,
  ): WellnessTaskMap {
    return readWellnessTasks(petId, date, today);
  }

  saveWellnessTask(
    petId: string,
    date: string,
    blockId: string,
    status: PersistedWellnessTaskStatus,
    today: string,
  ): void {
    writeWellnessTask(petId, date, blockId, status, today);
  }

  seedWellnessTasksFromBlockStates(
    petId: string,
    date: string,
    blockStates: Record<string, ScheduleCompletionRecord>,
    today: string,
  ): WellnessTaskMap {
    return seedTasksFromBlockStates(petId, date, blockStates, today);
  }

  getWellnessStreak(petId: string): WellnessStreakRecord {
    return readWellnessStreak(petId);
  }

  saveWellnessStreak(petId: string, record: WellnessStreakRecord): void {
    writeWellnessStreak(petId, record);
  }

  getRelaxedMode(userId: string): boolean {
    return readRelaxedMode(userId);
  }

  setRelaxedMode(userId: string, enabled: boolean): void {
    writeRelaxedMode(userId, enabled);
  }
}

export const createScheduleRepository = (): ScheduleRepository =>
  new ScheduleRepositoryImpl(createScheduleLocalDataSource());
