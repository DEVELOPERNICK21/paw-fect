import type {
  SmartHealthHistoryLog,
  SmartHealthRecord,
} from '../models/SmartHealthRecord';

export interface SmartHealthRecordRepository {
  listByPet(userId: string, petId: string): Promise<SmartHealthRecord[]>;
  upsertMany(records: SmartHealthRecord[]): Promise<void>;
  updateOne(record: SmartHealthRecord): Promise<void>;
  appendHistory(logs: SmartHealthHistoryLog[]): Promise<void>;
  deleteOne(userId: string, petId: string, recordId: string): Promise<void>;
  deleteAll(userId: string, petId: string): Promise<void>;
}
