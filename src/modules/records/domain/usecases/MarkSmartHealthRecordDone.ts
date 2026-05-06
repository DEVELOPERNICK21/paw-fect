import type {
  DewormingCadence,
  SmartHealthRecord,
} from '../models/SmartHealthRecord';
import type { SmartHealthRecordRepository } from '../repositories/SmartHealthRecordRepository';
import { requireValidDewormingComplete } from '../utils/DewormingEdgeCaseValidator';
import { PetCareLifecycleEngine } from '../utils/PetCareLifecycleEngine';
import {
  buildCompletionUpdate,
  createSmartHealthHistoryLog,
} from '../utils/SmartHealthScheduleUtils';
import { getTodayIsoDateLocal } from '../../../../shared/utils/calendarDate';
import { assertDateNotBeforePetDob } from '../utils/healthRecordDateGuards';
import {
  validateLogDateForCadence,
} from '../utils/DewormingEngine';
import {
  resolvePrerequisiteCompletedDate,
  validateVaccinationLogDate,
} from '../utils/vaccinationLogValidation';
import { getLastCompletedDewormingIsoDate } from '../utils/smartHealthDewormingInference';

export class MarkSmartHealthRecordDone {
  constructor(private readonly repository: SmartHealthRecordRepository) {}
  private readonly engine = new PetCareLifecycleEngine();

  async execute(
    record: SmartHealthRecord,
    completedDate?: string,
    petDateOfBirth?: string,
  ): Promise<void> {
    if (record.status === 'completed') {
      return;
    }

    const normalizedCompletedDate = (completedDate ?? getTodayIsoDateLocal()).slice(0, 10);

    assertDateNotBeforePetDob(
      normalizedCompletedDate,
      petDateOfBirth,
      'Completion date',
    );

    if (record.type === 'deworming') {
      requireValidDewormingComplete(record);
    }

    const allRecords = await this.repository.listByPet(record.userId, record.petId);
    const today = getTodayIsoDateLocal();

    if (record.type === 'deworming' && petDateOfBirth) {
      const lastCompletion = getLastCompletedDewormingIsoDate(
        allRecords,
        record.id,
      );
      const cadenceCheck = validateLogDateForCadence(
        petDateOfBirth,
        today,
        normalizedCompletedDate,
        (record.cadence ?? 'every_3_months') as DewormingCadence,
        lastCompletion,
        record.dueDate,
      );
      if (!cadenceCheck.ok) {
        throw new Error(cadenceCheck.error);
      }
      if (cadenceCheck.warning) {
        // eslint-disable-next-line no-console
        console.warn(
          '[MarkSmartHealthRecordDone] deworming log inside warn tier:',
          cadenceCheck.warning,
        );
      }
    }

    if (record.type === 'vaccination') {
      const prerequisiteCompleted = resolvePrerequisiteCompletedDate(
        allRecords,
        record.dependsOn,
      );
      if (record.dependsOn && !prerequisiteCompleted) {
        throw new Error(
          'Complete the previous dose in this vaccine series before logging this one.',
        );
      }
      if (petDateOfBirth) {
        const vaxCheck = validateVaccinationLogDate({
          petDateOfBirth,
          today,
          selectedDate: normalizedCompletedDate,
          dueDate: record.dueDate,
          prerequisiteCompletedDate: prerequisiteCompleted,
          isAnnualBooster: record.recurrenceType === 'yearly',
        });
        if (!vaxCheck.ok) {
          throw new Error(vaxCheck.error);
        }
        if (vaxCheck.warning) {
          // eslint-disable-next-line no-console
          console.warn(
            '[MarkSmartHealthRecordDone] vaccination log inside warn tier:',
            vaxCheck.warning,
          );
        }
      } else if (normalizedCompletedDate < record.dueDate) {
        throw new Error('Vaccination cannot be logged before the due date.');
      }
    }

    const { updated, next, logs } = buildCompletionUpdate(
      record,
      normalizedCompletedDate,
    );
    const completed = updated.completedDate ?? updated.dueDate;

    const recalculated = this.engine.recalculatePlanOnEvent({
      records: allRecords,
      event: {
        type: 'completion',
        recordId: record.id,
        completedDate: completed,
      },
      contextNowDate: getTodayIsoDateLocal(),
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
