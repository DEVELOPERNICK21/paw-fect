import type { SmartHealthRecord } from '../models/SmartHealthRecord';
import type { SmartHealthRecordRepository } from '../repositories/SmartHealthRecordRepository';
import {
  calendarDaysBetweenIsoDates,
  getTodayIsoDateLocal,
} from '../../../../shared/utils/calendarDate';
import { assertDateNotBeforePetDob } from '../utils/healthRecordDateGuards';
import { buildRescheduleUpdate } from '../utils/SmartHealthScheduleUtils';
import { PetCareLifecycleEngine } from '../utils/PetCareLifecycleEngine';
import { getLastCompletedDewormingIsoDate } from '../utils/smartHealthDewormingInference';

const toIsoDateOnly = (value: string): string => value.slice(0, 10);

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

  async execute(
    record: SmartHealthRecord,
    newDueDate: string,
    petDateOfBirth?: string,
  ): Promise<void> {
    if (record.status === 'completed') {
      // eslint-disable-next-line no-console
      console.warn(
        `[RescheduleSmartHealthRecord] Ignoring reschedule for completed record ${record.id}.`,
      );
      return;
    }

    const allRecords = await this.repository.listByPet(record.userId, record.petId);
    const today = getTodayIsoDateLocal();
    const nextDueDate = toIsoDateOnly(newDueDate);

    assertDateNotBeforePetDob(nextDueDate, petDateOfBirth, 'Due date');

    if (record.type === 'deworming' && nextDueDate < today) {
      throw new Error('Cannot reschedule deworming to a past date.');
    }

    if (record.type === 'deworming') {
      const baseline = getLastCompletedDewormingIsoDate(allRecords, record.id);
      const minGap = minGapDaysByCadence(record.cadence);
      if (baseline && minGap !== null && calendarDaysBetweenIsoDates(baseline, nextDueDate) < minGap) {
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

