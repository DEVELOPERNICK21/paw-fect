import type { SmartHealthRecord } from '../models/SmartHealthRecord';
import type { SmartHealthRecordRepository } from '../repositories/SmartHealthRecordRepository';
import { requireValidDewormingComplete } from '../utils/DewormingEdgeCaseValidator';
import { PetCareLifecycleEngine } from '../utils/PetCareLifecycleEngine';
import {
  buildCompletionUpdate,
  createSmartHealthHistoryLog,
} from '../utils/SmartHealthScheduleUtils';
import { getTodayIsoDateLocal } from '../../../../shared/utils/calendarDate';

export class MarkSmartHealthRecordDone {
  constructor(private readonly repository: SmartHealthRecordRepository) {}
  private readonly engine = new PetCareLifecycleEngine();

  async execute(record: SmartHealthRecord, completedDate?: string): Promise<void> {
    if (record.type === 'deworming') {
      requireValidDewormingComplete(record);
    }

    const { updated, next, logs } = buildCompletionUpdate(record, completedDate);
    const allRecords = await this.repository.listByPet(record.userId, record.petId);
    const today = getTodayIsoDateLocal();
    const completed = updated.completedDate ?? updated.dueDate;

    const recalculated = this.engine.recalculatePlanOnEvent({
      records: allRecords,
      event: {
        type: 'completion',
        recordId: record.id,
        completedDate: completed,
      },
      contextNowDate: today,
    });

    const persistedTarget = recalculated.find(r => r.id === record.id);
    if (!persistedTarget) {
      return;
    }

    const supersedeLogs = recalculated
      .filter(r => {
        const prev = allRecords.find(x => x.id === r.id);
        return (
          Boolean(prev) &&
          prev?.status !== 'skipped' &&
          r.status === 'skipped' &&
          (r.skipReason === 'superseded_by_completion' ||
            r.skipReason === 'superseded_open_dose')
        );
      })
      .map(r =>
        createSmartHealthHistoryLog(r.userId, r.petId, r.id, 'skipped', {
          reason: r.skipReason ?? 'superseded',
        }),
      );

    const changed = recalculated.filter(r => {
      const prev = allRecords.find(x => x.id === r.id);
      if (!prev) {
        return true;
      }
      return (
        prev.dueDate !== r.dueDate ||
        prev.status !== r.status ||
        prev.completedDate !== r.completedDate ||
        prev.key !== r.key ||
        prev.skipReason !== r.skipReason ||
        prev.recovery?.recoveryReason !== r.recovery?.recoveryReason
      );
    });

    await this.repository.updateOne(persistedTarget);

    const others = changed.filter(r => r.id !== persistedTarget.id);
    const nextToInsert =
      next && !allRecords.some(existing => existing.id === next.id) ? [next] : [];

    if (others.length > 0 || nextToInsert.length > 0) {
      await this.repository.upsertMany([...nextToInsert, ...others]);
    }

    await this.repository.appendHistory([...logs, ...supersedeLogs]);
  }
}
