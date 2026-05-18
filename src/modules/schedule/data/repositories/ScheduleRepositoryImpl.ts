import type { PetSchedulePreferences } from '../../domain/models/PetProfile';
import type {
  ScheduleCompletionRecord,
  ScheduleRepository,
} from '../../domain/repositories/ScheduleRepository';
import type { ScheduleLocalDataSource } from '../datasources/ScheduleLocalDataSource';

import { createScheduleLocalDataSource } from '../datasources/ScheduleLocalDataSource';

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

  saveDailyCompletionPercent(
    userId: string,
    petId: string,
    date: string,
    percent: number,
  ): Promise<void> {
    return this.local.saveDailyCompletionPercent(userId, petId, date, percent);
  }
}

export const createScheduleRepository = (): ScheduleRepository =>
  new ScheduleRepositoryImpl(createScheduleLocalDataSource());
