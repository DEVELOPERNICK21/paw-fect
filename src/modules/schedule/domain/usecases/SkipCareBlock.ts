import type { ScheduleRepository } from '../repositories/ScheduleRepository';

export interface SkipCareBlockInput {
  userId: string;
  petId: string;
  date: string;
  blockId: string;
}

/**
 * Marks a daily care block skipped for the day (completion SSOT).
 */
export class SkipCareBlock {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async execute(input: SkipCareBlockInput): Promise<void> {
    await this.scheduleRepository.saveBlockState(
      input.userId,
      input.petId,
      input.date,
      input.blockId,
      {
        completedAt: null,
        snoozedUntil: null,
        skippedAt: new Date().toISOString(),
      },
    );
  }
}
