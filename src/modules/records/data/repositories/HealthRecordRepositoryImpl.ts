import type { HealthRecord } from '../../domain/models/HealthRecord';
import type { HealthRecordRepository } from '../../domain/repositories/HealthRecordRepository';
import type { HealthRecordRemoteDataSource } from '../datasources/HealthRecordRemoteDataSource';
import {
  createHealthRecordRemoteDataSource,
} from '../datasources/HealthRecordRemoteDataSource';
import type { HealthRecordLocalDataSource } from '../datasources/HealthRecordLocalDataSource';
import {
  createHealthRecordLocalDataSource,
} from '../datasources/HealthRecordLocalDataSource';

export class HealthRecordRepositoryImpl implements HealthRecordRepository {
  constructor(
    private readonly remote: HealthRecordRemoteDataSource,
    private readonly local: HealthRecordLocalDataSource,
  ) {}

  async getRecords(): Promise<HealthRecord[]> {
    const cached = await this.local.getRecords();
    if (cached.length > 0) {
      return cached;
    }

    const remoteRecords = await this.remote.fetchRecords();
    await this.local.saveRecords(remoteRecords);
    return remoteRecords;
  }

  async createRecord(record: HealthRecord): Promise<HealthRecord> {
    const created = await this.remote.createRecord(record);
    const records = await this.local.getRecords();
    await this.local.saveRecords([...records, created]);
    return created;
  }

  async deleteRecord(id: string): Promise<void> {
    await this.remote.deleteRecord(id);
    const records = await this.local.getRecords();
    const next = records.filter(record => record.id !== id);
    await this.local.saveRecords(next);
  }
}

export const createHealthRecordRepository = (): HealthRecordRepository => {
  const remote = createHealthRecordRemoteDataSource();
  const local = createHealthRecordLocalDataSource();
  return new HealthRecordRepositoryImpl(remote, local);
};

