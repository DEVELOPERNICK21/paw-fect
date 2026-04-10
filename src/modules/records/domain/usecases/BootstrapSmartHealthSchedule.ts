import type { SmartHealthRecordRepository } from '../repositories/SmartHealthRecordRepository';
import type { BootstrapSmartScheduleInput } from '../models/SmartHealthRecord';
import { generateBootstrapSchedule } from '../utils/SmartHealthScheduleUtils';

export class BootstrapSmartHealthSchedule {
  constructor(private readonly repository: SmartHealthRecordRepository) {}

  async execute(input: BootstrapSmartScheduleInput): Promise<void> {
    const existing = await this.repository.listByPet(input.userId, input.petId);

    const completedDeworming = existing
      .filter(record => record.type === 'deworming' && record.status === 'completed')
      .sort((a, b) =>
        (b.completedDate ?? b.dueDate).localeCompare(a.completedDate ?? a.dueDate),
      );
    const inferredLastDewormingDate = completedDeworming[0]?.completedDate
      ? completedDeworming[0].completedDate
      : completedDeworming[0]?.dueDate;

    const effectiveInput: BootstrapSmartScheduleInput = {
      ...input,
      lastDewormingDate: input.lastDewormingDate ?? inferredLastDewormingDate,
    };

    const { records, logs } = generateBootstrapSchedule(effectiveInput);

    const existingByKey = new Map(
      existing.map(record => [`${record.type}:${record.key ?? ''}`, record]),
    );

    const generatedByKey = new Map(
      records.map(record => [`${record.type}:${record.key ?? ''}`, record]),
    );

    const recordsToUpsert = records.filter(record => {
      const key = `${record.type}:${record.key ?? ''}`;
      const prev = existingByKey.get(key);
      if (!prev) return true;
      return (
        prev.dueDate !== record.dueDate ||
        prev.status !== record.status ||
        prev.completedDate !== record.completedDate ||
        prev.cadence !== record.cadence ||
        prev.recurrenceType !== record.recurrenceType
      );
    });

    const staleDeworming = existing.filter(record => {
      if (record.type !== 'deworming') return false;
      if (record.status === 'completed') return false;
      if (record.status === 'skipped') return false;
      const key = `${record.type}:${record.key ?? ''}`;
      return !generatedByKey.has(key);
    });

    for (const stale of staleDeworming) {
      await this.repository.deleteOne(input.userId, input.petId, stale.id);
    }

    if (recordsToUpsert.length > 0) {
      await this.repository.upsertMany(recordsToUpsert);
    }

    const logsToCreate = logs.filter(log =>
      recordsToUpsert.some(record => record.id === log.recordId),
    );
    if (logsToCreate.length > 0) {
      await this.repository.appendHistory(logsToCreate);
    }
  }
}
