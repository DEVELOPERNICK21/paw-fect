import type {
  SmartHealthHistoryLog,
  SmartHealthRecord,
} from '../../domain/models/SmartHealthRecord';
import type { SmartHealthRecordRepository } from '../../domain/repositories/SmartHealthRecordRepository';
import { MockSmartHealthRecordRepository } from './MockSmartHealthRecordRepository';
import type { SmartHealthRecordRemoteDataSource } from '../datasources/SmartHealthRecordRemoteDataSource';
import { createSmartHealthRecordRemoteDataSource } from '../datasources/SmartHealthRecordRemoteDataSource';

export class SmartHealthRecordRepositoryImpl
  implements SmartHealthRecordRepository
{
  constructor(private readonly remote: SmartHealthRecordRemoteDataSource) {}

  async listByPet(userId: string, petId: string): Promise<SmartHealthRecord[]> {
    return this.remote.listByPet(userId, petId);
  }

  async upsertMany(records: SmartHealthRecord[]): Promise<void> {
    await this.remote.upsertMany(records);
  }

  async updateOne(record: SmartHealthRecord): Promise<void> {
    await this.remote.updateOne(record);
  }

  async appendHistory(logs: SmartHealthHistoryLog[]): Promise<void> {
    await this.remote.appendHistory(logs);
  }

  async deleteOne(
    userId: string,
    petId: string,
    recordId: string,
  ): Promise<void> {
    await this.remote.deleteOne(userId, petId, recordId);
  }

  async deleteAll(userId: string, petId: string): Promise<void> {
    await this.remote.deleteAll(userId, petId);
  }
}

export type SmartHealthRecordRepositoryAdapter = 'firebase' | 'mock';

interface CreateSmartHealthRecordRepositoryOptions {
  adapter?: SmartHealthRecordRepositoryAdapter;
}

export const createSmartHealthRecordRepository = (
  options?: CreateSmartHealthRecordRepositoryOptions,
): SmartHealthRecordRepository => {
  if (options?.adapter === 'mock') {
    return new MockSmartHealthRecordRepository();
  }
  const remote = createSmartHealthRecordRemoteDataSource();
  return new SmartHealthRecordRepositoryImpl(remote);
};
