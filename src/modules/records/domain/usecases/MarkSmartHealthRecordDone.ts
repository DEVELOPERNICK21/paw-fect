import type { SmartHealthRecord } from '../models/SmartHealthRecord';
import type { SmartHealthRecordRepository } from '../repositories/SmartHealthRecordRepository';
import { buildCompletionUpdate } from '../utils/SmartHealthScheduleUtils';
import { PetCareLifecycleEngine } from '../utils/PetCareLifecycleEngine';

export class MarkSmartHealthRecordDone {
  constructor(private readonly repository: SmartHealthRecordRepository) {}
  private readonly engine = new PetCareLifecycleEngine();

  async execute(record: SmartHealthRecord, completedDate?: string): Promise<void> {
    const { updated, next, logs } = buildCompletionUpdate(record, completedDate);
    const allRecords = await this.repository.listByPet(record.userId, record.petId);
    const recalculated = this.engine.recalculatePlanOnEvent({
      records: allRecords,
      event: {
        type:
          completedDate && completedDate < record.dueDate
            ? 'backdated_entry'
            : 'late_completion',
        recordId: record.id,
        completedDate: updated.completedDate ?? updated.dueDate,
      },
      contextNowDate: new Date().toISOString().slice(0, 10),
    });
    await this.repository.updateOne(updated);
    const extraRecords = recalculated.filter(
      item =>
        item.id !== updated.id &&
        !allRecords.some(existing => existing.id === item.id),
    );
    if (next || extraRecords.length > 0) {
      await this.repository.upsertMany([...(next ? [next] : []), ...extraRecords]);
    }
    await this.repository.appendHistory(logs);
  }
}

