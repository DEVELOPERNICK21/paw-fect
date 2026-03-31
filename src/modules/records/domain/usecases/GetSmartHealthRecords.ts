import type { SmartHealthRecord } from '../models/SmartHealthRecord';
import type { SmartHealthRecordRepository } from '../repositories/SmartHealthRecordRepository';
import { normalizeSmartRecordStatus } from '../utils/SmartHealthScheduleUtils';

export class GetSmartHealthRecords {
  constructor(private readonly repository: SmartHealthRecordRepository) {}

  async execute(userId: string, petId: string): Promise<SmartHealthRecord[]> {
    const nowDate = new Date().toISOString().slice(0, 10);
    const records = await this.repository.listByPet(userId, petId);
    const normalized = records.map(record =>
      normalizeSmartRecordStatus(record, nowDate),
    );
    return normalized.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }
}

