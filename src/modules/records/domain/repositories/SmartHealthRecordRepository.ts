import type {
  SmartHealthHistoryLog,
  SmartHealthRecord,
} from '../models/SmartHealthRecord';
import type {
  SmartHealthQueueEntry,
  SmartHealthQueueEntryInput,
} from '../models/SmartHealthQueueEntry';

export interface SmartHealthRecordRepository {
  listByPet(userId: string, petId: string): Promise<SmartHealthRecord[]>;
  upsertMany(records: SmartHealthRecord[]): Promise<void>;
  updateOne(record: SmartHealthRecord): Promise<void>;
  appendHistory(logs: SmartHealthHistoryLog[]): Promise<void>;
  deleteOne(userId: string, petId: string, recordId: string): Promise<void>;
  deleteAll(userId: string, petId: string): Promise<void>;
  getCachedRecords(userId: string, petId: string): Promise<SmartHealthRecord[]>;
  saveCachedRecords(
    userId: string,
    petId: string,
    records: SmartHealthRecord[],
  ): Promise<void>;
  saveCachedRecordsFromServer(
    userId: string,
    petId: string,
    records: SmartHealthRecord[],
  ): Promise<void>;
  mergeWithPendingQueue(
    userId: string,
    petId: string,
    records: SmartHealthRecord[],
  ): Promise<SmartHealthRecord[]>;
  enqueueMutation(
    userId: string,
    entry: SmartHealthQueueEntryInput,
  ): Promise<SmartHealthQueueEntry>;
  removeQueueEntry(userId: string, entryId: string): Promise<void>;
  processSyncQueue(userId: string): Promise<number>;
  getPendingSyncCount(userId: string): Promise<number>;
}
