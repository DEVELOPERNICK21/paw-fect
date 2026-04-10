import type { SmartHealthRecord } from '../models/SmartHealthRecord';
import type { SmartHealthRecordRepository } from '../repositories/SmartHealthRecordRepository';
import { getTodayIsoDateLocal } from '../../../../shared/utils/calendarDate';
import { normalizeSmartRecordStatus } from '../utils/SmartHealthScheduleUtils';

export class GetSmartHealthRecords {
  constructor(private readonly repository: SmartHealthRecordRepository) {}

  async execute(userId: string, petId: string): Promise<SmartHealthRecord[]> {
    const nowDate = getTodayIsoDateLocal();
    const records = await this.repository.listByPet(userId, petId);
    const normalized = records.map(record =>
      normalizeSmartRecordStatus(record, nowDate),
    );
    const byId = new Map(records.map(r => [r.id, r]));
    const changed = normalized.filter(n => {
      const prev = byId.get(n.id);
      if (!prev) {
        return false;
      }
      return prev.status !== n.status || prev.updatedAt !== n.updatedAt;
    });
    if (changed.length > 0) {
      await this.repository.upsertMany(changed);
    }
    return normalized.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }
}

