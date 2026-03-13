import type { HealthRecord } from '../../domain/models/HealthRecord';
import { storageService } from '../../../../infrastructure/storage/storageService';

const HEALTH_RECORDS_STORAGE_KEY = 'healthRecords';

export interface HealthRecordLocalDataSource {
  getRecords(): Promise<HealthRecord[]>;
  saveRecords(records: HealthRecord[]): Promise<void>;
}

class HealthRecordLocalDataSourceImpl implements HealthRecordLocalDataSource {
  async getRecords(): Promise<HealthRecord[]> {
    const records =
      await storageService.getItem<HealthRecord[]>(
        HEALTH_RECORDS_STORAGE_KEY,
      );
    return records ?? [];
  }

  async saveRecords(records: HealthRecord[]): Promise<void> {
    await storageService.setItem(HEALTH_RECORDS_STORAGE_KEY, records);
  }
}

export const createHealthRecordLocalDataSource =
  (): HealthRecordLocalDataSource => new HealthRecordLocalDataSourceImpl();

