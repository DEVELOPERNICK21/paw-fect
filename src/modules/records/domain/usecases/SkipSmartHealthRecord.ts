import type { SmartHealthRecord } from '../models/SmartHealthRecord';
import type { SmartHealthRecordRepository } from '../repositories/SmartHealthRecordRepository';
import { getTodayIsoDateLocal } from '../../../../shared/utils/calendarDate';
import { requireValidDewormingSkip } from '../utils/DewormingEdgeCaseValidator';
import { PetCareLifecycleEngine } from '../utils/PetCareLifecycleEngine';
import { createSmartHealthHistoryLog } from '../utils/SmartHealthScheduleUtils';

export class SkipSmartHealthRecord {
  constructor(private readonly repository: SmartHealthRecordRepository) {}
  private readonly engine = new PetCareLifecycleEngine();

  async execute(
    record: SmartHealthRecord,
    reason: string,
    petDateOfBirth?: string,
  ): Promise<void> {
    if (record.type !== 'deworming') {
      throw new Error('Skip dose is only supported for deworming records.');
    }
    requireValidDewormingSkip(record, reason);

    const allRecords = await this.repository.listByPet(record.userId, record.petId);
    const today = getTodayIsoDateLocal();

    const recalculated = this.engine.recalculatePlanOnEvent({
      records: allRecords,
      event: {
        type: 'skip_dose',
        recordId: record.id,
        reason: reason.trim(),
        petDateOfBirth,
      },
      contextNowDate: today,
      petDateOfBirth,
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
          r.skipReason === 'superseded_open_dose'
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
        prev.key !== r.key ||
        prev.skipReason !== r.skipReason
      );
    });

    await this.repository.updateOne(persistedTarget);
    const others = changed.filter(r => r.id !== persistedTarget.id);
    if (others.length > 0) {
      await this.repository.upsertMany(others);
    }

    await this.repository.appendHistory([
      createSmartHealthHistoryLog(
        persistedTarget.userId,
        persistedTarget.petId,
        persistedTarget.id,
        'skipped',
        { reason: reason.trim() },
      ),
      ...supersedeLogs,
    ]);
  }
}
