import type { HealthRecord } from '../models/HealthRecord';
import type { HealthRecordRepository } from '../repositories/HealthRecordRepository';

export class GetRecords {
  constructor(private readonly repository: HealthRecordRepository) {}

  async execute(): Promise<HealthRecord[]> {
    return this.repository.getRecords();
  }
}

