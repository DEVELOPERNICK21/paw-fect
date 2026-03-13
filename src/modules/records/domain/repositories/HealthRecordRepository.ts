import type { HealthRecord } from '../models/HealthRecord';

export interface HealthRecordRepository {
  getRecords(): Promise<HealthRecord[]>;
  createRecord(record: HealthRecord): Promise<HealthRecord>;
  deleteRecord(id: string): Promise<void>;
}

