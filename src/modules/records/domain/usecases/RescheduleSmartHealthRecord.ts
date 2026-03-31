import type { SmartHealthRecord } from '../models/SmartHealthRecord';
import type { SmartHealthRecordRepository } from '../repositories/SmartHealthRecordRepository';
import { buildRescheduleUpdate } from '../utils/SmartHealthScheduleUtils';

export class RescheduleSmartHealthRecord {
  constructor(private readonly repository: SmartHealthRecordRepository) {}

  async execute(record: SmartHealthRecord, newDueDate: string): Promise<void> {
    const { updated, log } = buildRescheduleUpdate(record, newDueDate);
    await this.repository.updateOne(updated);
    await this.repository.appendHistory([log]);
  }
}

