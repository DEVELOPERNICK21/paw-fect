import type { PetSchedulePreferences } from '../models/PetProfile';
import { DEFAULT_PET_SCHEDULE_PREFERENCES } from '../DailyScheduleEngine';
import type { ScheduleRepository } from '../repositories/ScheduleRepository';

export interface GetSchedulePreferencesInput {
  userId: string;
  petId: string;
}

export class GetSchedulePreferences {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async execute(input: GetSchedulePreferencesInput): Promise<PetSchedulePreferences> {
    const stored = await this.scheduleRepository.getPreferences(
      input.userId,
      input.petId,
    );
    return stored ?? DEFAULT_PET_SCHEDULE_PREFERENCES;
  }
}
