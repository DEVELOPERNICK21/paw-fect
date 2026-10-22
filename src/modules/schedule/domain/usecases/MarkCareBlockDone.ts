import type { ScheduleRepository } from '../repositories/ScheduleRepository';

export interface MarkCareBlockDoneInput {
  userId: string;
  petId: string;
  date: string;
  blockId: string;
  completed: boolean;
}

export interface MarkCareBlockDoneResult {
  /** `true` only when this call moved the block from not-completed to completed. */
  completionChanged: boolean;
}

export class MarkCareBlockDone {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async execute(input: MarkCareBlockDoneInput): Promise<MarkCareBlockDoneResult> {
    const existing = (
      await this.scheduleRepository.getBlockStates(
        input.userId,
        input.petId,
        input.date,
      )
    )[input.blockId];

    await this.scheduleRepository.saveBlockState(
      input.userId,
      input.petId,
      input.date,
      input.blockId,
      {
        completedAt: input.completed ? new Date().toISOString() : null,
        snoozedUntil: input.completed ? null : (existing?.snoozedUntil ?? null),
        skippedAt: null,
      },
    );

    return {
      completionChanged: input.completed && existing?.completedAt == null,
    };
  }
}
