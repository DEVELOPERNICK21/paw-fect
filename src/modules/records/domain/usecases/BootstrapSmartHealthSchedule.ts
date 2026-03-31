import type { SmartHealthRecordRepository } from '../repositories/SmartHealthRecordRepository';
import type { BootstrapSmartScheduleInput } from '../models/SmartHealthRecord';
import { generateBootstrapSchedule } from '../utils/SmartHealthScheduleUtils';

export class BootstrapSmartHealthSchedule {
  constructor(private readonly repository: SmartHealthRecordRepository) {}

  async execute(input: BootstrapSmartScheduleInput): Promise<void> {
    const existing = await this.repository.listByPet(input.userId, input.petId);
    if (existing.length > 0) {
      return;
    }
    const { records, logs } = generateBootstrapSchedule(input);
    await this.repository.upsertMany(records);
    await this.repository.appendHistory(logs);
  }
}

