import type { SmartHealthRecord } from '../models/SmartHealthRecord';
import type { SmartHealthRecordRepository } from '../repositories/SmartHealthRecordRepository';
import { buildRescheduleUpdate } from '../utils/SmartHealthScheduleUtils';
import { PetCareLifecycleEngine } from '../utils/PetCareLifecycleEngine';

export class RescheduleSmartHealthRecord {
  constructor(private readonly repository: SmartHealthRecordRepository) {}
  private readonly engine = new PetCareLifecycleEngine();

  async execute(record: SmartHealthRecord, newDueDate: string): Promise<void> {
    const { updated, log } = buildRescheduleUpdate(record, newDueDate);
    const allRecords = await this.repository.listByPet(record.userId, record.petId);
    const recalculated = this.engine.recalculatePlanOnEvent({
      records: allRecords,
      event: {
        type: 'manual_adjustment',
        recordId: record.id,
        dueDate: newDueDate,
      },
      contextNowDate: new Date().toISOString().slice(0, 10),
    });
    await this.repository.updateOne(updated);
    const futureAdjustments = recalculated.filter(
      item =>
        item.id !== updated.id &&
        allRecords.some(existing => existing.id === item.id && existing.dueDate !== item.dueDate),
    );
    if (futureAdjustments.length > 0) {
      await this.repository.upsertMany(futureAdjustments);
    }
    await this.repository.appendHistory([log]);
  }
}

