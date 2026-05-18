import type { PetSchedulePreferences } from '../models/PetProfile';
import type { ScheduleRepository } from '../repositories/ScheduleRepository';

export interface SaveSchedulePreferencesInput {
  userId: string;
  petId: string;
  preferences: PetSchedulePreferences;
}

export class SaveSchedulePreferences {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async execute(input: SaveSchedulePreferencesInput): Promise<void> {
    await this.scheduleRepository.savePreferences(
      input.userId,
      input.petId,
      input.preferences,
    );
  }
}
