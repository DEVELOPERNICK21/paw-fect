import type { ScheduleRepository } from '../repositories/ScheduleRepository';
import { addMinutes } from '../utils/scheduleTime';

export interface SnoozeCareBlockInput {
  userId: string;
  petId: string;
  date: string;
  blockId: string;
  currentTime: string;
  snoozeMinutes: number;
}

export class SnoozeCareBlock {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async execute(input: SnoozeCareBlockInput): Promise<string> {
    const nextTime = addMinutes(input.currentTime, input.snoozeMinutes);
    const snoozedUntil = `${input.date}T${nextTime}:00`;
    await this.scheduleRepository.saveBlockState(
      input.userId,
      input.petId,
      input.date,
      input.blockId,
      {
        completedAt: null,
        snoozedUntil,
      },
    );
    return nextTime;
  }
}
