import type {
  SmartHealthHistoryLog,
  SmartHealthRecord,
} from '../../domain/models/SmartHealthRecord';
import type { SmartHealthRecordRepository } from '../../domain/repositories/SmartHealthRecordRepository';

const mockRecordDb = new Map<string, SmartHealthRecord[]>();
const mockHistoryDb = new Map<string, SmartHealthHistoryLog[]>();

const keyFor = (userId: string, petId: string): string => `${userId}:${petId}`;

export class MockSmartHealthRecordRepository implements SmartHealthRecordRepository {
  async listByPet(userId: string, petId: string): Promise<SmartHealthRecord[]> {
    const key = keyFor(userId, petId);
    return (mockRecordDb.get(key) ?? []).slice();
  }

  async upsertMany(records: SmartHealthRecord[]): Promise<void> {
    if (records.length === 0) return;
    const grouped = new Map<string, SmartHealthRecord[]>();
    for (const record of records) {
      const key = keyFor(record.userId, record.petId);
      const list = grouped.get(key) ?? [];
      list.push(record);
      grouped.set(key, list);
    }

    grouped.forEach((incoming, key) => {
      const existing = mockRecordDb.get(key) ?? [];
      const byId = new Map(existing.map(record => [record.id, record]));
      for (const record of incoming) {
        byId.set(record.id, record);
      }
      mockRecordDb.set(key, Array.from(byId.values()));
    });
  }

  async updateOne(record: SmartHealthRecord): Promise<void> {
    await this.upsertMany([record]);
  }

  async appendHistory(logs: SmartHealthHistoryLog[]): Promise<void> {
    if (logs.length === 0) return;
    for (const log of logs) {
      const key = keyFor(log.userId, log.petId);
      const existing = mockHistoryDb.get(key) ?? [];
      mockHistoryDb.set(key, [...existing, log]);
    }
  }
}
