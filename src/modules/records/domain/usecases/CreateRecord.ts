import type { HealthRecord } from '../models/HealthRecord';
import type { HealthRecordRepository } from '../repositories/HealthRecordRepository';

export class CreateRecord {
  constructor(private readonly repository: HealthRecordRepository) {}

  async execute(record: HealthRecord): Promise<HealthRecord> {
    return this.repository.createRecord(record);
  }
}

