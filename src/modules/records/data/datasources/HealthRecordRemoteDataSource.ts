import type { HealthRecord } from '../../domain/models/HealthRecord';
import { apiClient } from '../../../../infrastructure/api/apiClient';

export interface HealthRecordRemoteDataSource {
  fetchRecords(): Promise<HealthRecord[]>;
  createRecord(record: HealthRecord): Promise<HealthRecord>;
  deleteRecord(id: string): Promise<void>;
}

class HealthRecordRemoteDataSourceImpl
  implements HealthRecordRemoteDataSource
{
  async fetchRecords(): Promise<HealthRecord[]> {
    const response = await apiClient.request<HealthRecord[]>({
      path: '/health-records',
      method: 'GET',
    });

    return response.data ?? [];
  }

  async createRecord(record: HealthRecord): Promise<HealthRecord> {
    const response = await apiClient.request<HealthRecord, HealthRecord>({
      path: '/health-records',
      method: 'POST',
      body: record,
    });

    if (!response.data) {
      throw new Error('Failed to create health record');
    }

    return response.data;
  }

  async deleteRecord(id: string): Promise<void> {
    await apiClient.request<void>({
      path: `/health-records/${id}`,
      method: 'DELETE',
    });
  }
}

export const createHealthRecordRemoteDataSource =
  (): HealthRecordRemoteDataSource => new HealthRecordRemoteDataSourceImpl();

