import type { HealthRecordRepository } from '../repositories/HealthRecordRepository';

export class DeleteRecord {
  constructor(private readonly repository: HealthRecordRepository) {}

  async execute(id: string): Promise<void> {
    return this.repository.deleteRecord(id);
  }
}

