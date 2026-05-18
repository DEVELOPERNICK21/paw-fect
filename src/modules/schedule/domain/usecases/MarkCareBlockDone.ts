import type { ScheduleRepository } from '../repositories/ScheduleRepository';

export interface MarkCareBlockDoneInput {
  userId: string;
  petId: string;
  date: string;
  blockId: string;
  completed: boolean;
}

export class MarkCareBlockDone {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async execute(input: MarkCareBlockDoneInput): Promise<void> {
    await this.scheduleRepository.saveBlockState(
      input.userId,
      input.petId,
      input.date,
      input.blockId,
      {
        completedAt: input.completed ? new Date().toISOString() : null,
        snoozedUntil: null,
      },
    );
  }
}
