import type { SmartHealthRecord } from '../models/SmartHealthRecord';
import type { SmartHealthRecordRepository } from '../repositories/SmartHealthRecordRepository';
import { getTodayIsoDateLocal } from '../../../../shared/utils/calendarDate';
import { buildRescheduleUpdate } from '../utils/SmartHealthScheduleUtils';
import { PetCareLifecycleEngine } from '../utils/PetCareLifecycleEngine';

const toIsoDateOnly = (value: string): string => value.slice(0, 10);

const daysBetween = (from: string, to: string): number => {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.floor((b - a) / (24 * 60 * 60 * 1000));
};

const minGapDaysByCadence = (
  cadence: SmartHealthRecord['cadence'],
): number | null => {
  switch (cadence) {
    case 'every_14_days':
      return 12;
    case 'monthly':
      return 28;
    case 'every_2_months':
      return 56;
    case 'every_3_months':
      return 84;
    default:
      return null;
  }
};

export class RescheduleSmartHealthRecord {
  constructor(private readonly repository: SmartHealthRecordRepository) {}
  private readonly engine = new PetCareLifecycleEngine();

  async execute(record: SmartHealthRecord, newDueDate: string): Promise<void> {
    const allRecords = await this.repository.listByPet(record.userId, record.petId);
    const today = getTodayIsoDateLocal();
    const nextDueDate = toIsoDateOnly(newDueDate);

    if (record.type === 'deworming' && nextDueDate < today) {
      throw new Error('Cannot reschedule deworming to a past date.');
    }

    if (record.type === 'deworming') {
      const lastCompleted = allRecords
        .filter(
          item =>
            item.type === 'deworming' &&
            item.status === 'completed' &&
            item.id !== record.id,
        )
        .sort((a, b) =>
          (b.completedDate ?? b.dueDate).localeCompare(a.completedDate ?? a.dueDate),
        )[0];
      const baseline = lastCompleted?.completedDate ?? lastCompleted?.dueDate;
      const minGap = minGapDaysByCadence(record.cadence);
      if (baseline && minGap !== null && daysBetween(baseline, nextDueDate) < minGap) {
        throw new Error(
          `This schedule is too close to the last deworming dose. Keep at least ${minGap} days gap.`,
        );
      }
    }

    const { updated, log } = buildRescheduleUpdate(record, nextDueDate);
    const recalculated = this.engine.recalculatePlanOnEvent({
      records: allRecords,
      event: {
        type: 'manual_adjustment',
        recordId: record.id,
        dueDate: nextDueDate,
      },
      contextNowDate: today,
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

