import { getTodayIsoDateLocal } from '../../../../shared/utils/calendarDate';
import type { ScheduleRepository } from '../repositories/ScheduleRepository';

export interface MigrateWellnessTasksToBlockStatesInput {
  userId: string;
  petId: string;
  date: string;
}

/**
 * One-way migration: copy MMKV wellness task done/skipped into
 * AsyncStorage schedule_block_states so completion has a single SSOT.
 * Safe to call repeatedly — only fills missing block-state fields.
 */
export class MigrateWellnessTasksToBlockStates {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async execute(
    input: MigrateWellnessTasksToBlockStatesInput,
  ): Promise<void> {
    const today = getTodayIsoDateLocal();
    const taskMap = this.scheduleRepository.getWellnessTasks(
      input.petId,
      input.date,
      today,
    );
    if (Object.keys(taskMap).length === 0) {
      return;
    }

    const states = await this.scheduleRepository.getBlockStates(
      input.userId,
      input.petId,
      input.date,
    );

    for (const [blockId, task] of Object.entries(taskMap)) {
      const existing = states[blockId];
      if (task.status === 'done') {
        if (existing?.completedAt != null) {
          continue;
        }
        await this.scheduleRepository.saveBlockState(
          input.userId,
          input.petId,
          input.date,
          blockId,
          {
            completedAt: task.updatedAt,
            snoozedUntil: existing?.snoozedUntil ?? null,
            skippedAt: null,
          },
        );
        continue;
      }
      if (task.status === 'skipped') {
        if (existing?.completedAt != null || existing?.skippedAt != null) {
          continue;
        }
        await this.scheduleRepository.saveBlockState(
          input.userId,
          input.petId,
          input.date,
          blockId,
          {
            completedAt: null,
            snoozedUntil: null,
            skippedAt: task.updatedAt,
          },
        );
      }
    }
  }
}
