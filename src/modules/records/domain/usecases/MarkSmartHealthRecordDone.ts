import type { SmartHealthRecord } from '../models/SmartHealthRecord';
import type { SmartHealthRecordRepository } from '../repositories/SmartHealthRecordRepository';
import { buildCompletionUpdate } from '../utils/SmartHealthScheduleUtils';

export class MarkSmartHealthRecordDone {
  constructor(private readonly repository: SmartHealthRecordRepository) {}

  async execute(record: SmartHealthRecord, completedDate?: string): Promise<void> {
    const { updated, next, logs } = buildCompletionUpdate(record, completedDate);
    await this.repository.updateOne(updated);
    if (next) {
      await this.repository.upsertMany([next]);
    }
    await this.repository.appendHistory(logs);
  }
}

