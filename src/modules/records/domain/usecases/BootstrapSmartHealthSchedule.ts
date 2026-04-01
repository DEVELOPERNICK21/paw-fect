import type { SmartHealthRecordRepository } from '../repositories/SmartHealthRecordRepository';
import type { BootstrapSmartScheduleInput } from '../models/SmartHealthRecord';
import { generateBootstrapSchedule } from '../utils/SmartHealthScheduleUtils';

export class BootstrapSmartHealthSchedule {
  constructor(private readonly repository: SmartHealthRecordRepository) {}

  async execute(input: BootstrapSmartScheduleInput): Promise<void> {
    const existing = await this.repository.listByPet(input.userId, input.petId);
    const { records, logs } = generateBootstrapSchedule(input);
    const existingKeys = new Set(
      existing.map(record => `${record.type}:${record.key ?? ''}:${record.dueDate}:${record.name}`),
    );
    const recordsToCreate = records.filter(
      record =>
        !existingKeys.has(
          `${record.type}:${record.key ?? ''}:${record.dueDate}:${record.name}`,
        ),
    );
    if (recordsToCreate.length === 0) return;
    const logsToCreate = logs.filter(log =>
      recordsToCreate.some(record => record.id === log.recordId),
    );
    await this.repository.upsertMany(recordsToCreate);
    await this.repository.appendHistory(logsToCreate);
  }
}

