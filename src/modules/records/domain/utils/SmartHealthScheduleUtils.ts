import type {
  BootstrapSmartScheduleInput,
  SmartHealthHistoryLog,
  SmartHealthRecord,
  SmartHealthRecordStatus,
} from '../models/SmartHealthRecord';
import { createLocalId } from '../../../../shared/utils/id';
import { getTodayIsoDateLocal } from '../../../../shared/utils/calendarDate';
import { resolveCarePlanRegion } from '../../../../shared/utils/inferDefaultPetRegion';
import type { CarePlanContext } from '../models/CarePlanTemplate';
import { PetCareLifecycleEngine } from './PetCareLifecycleEngine';

const ISO_DATE_ONLY_LENGTH = 10;
const LOCK_WINDOW_DAYS = 30;

const lifecycleEngine = new PetCareLifecycleEngine();

function toIsoDateOnly(input: string): string {
  if (!input) return input;
  if (input.length >= ISO_DATE_ONLY_LENGTH) {
    return input.slice(0, ISO_DATE_ONLY_LENGTH);
  }
  return input;
}

function addMonths(dateOnly: string, months: number): string {
  const [year, month, day] = dateOnly.split('-').map(Number);
  const d = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function addDays(dateOnly: string, days: number): string {
  const [year, month, day] = dateOnly.split('-').map(Number);
  const d = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(fromDate: string, toDate: string): number {
  const from = new Date(`${fromDate}T00:00:00`).getTime();
  const to = new Date(`${toDate}T00:00:00`).getTime();
  return Math.floor((to - from) / (24 * 60 * 60 * 1000));
}

export function resolveSmartStatus(
  dueDate: string,
  completedDate: string | null,
  todayDate: string,
  lockWindowDays = LOCK_WINDOW_DAYS,
): SmartHealthRecordStatus {
  if (completedDate) return 'completed';
  if (todayDate > dueDate) return 'overdue';
  if (daysBetween(todayDate, dueDate) > lockWindowDays) return 'locked';
  return 'upcoming';
}

export function normalizeSmartRecordStatus(
  record: SmartHealthRecord,
  todayDate: string,
): SmartHealthRecord {
  if (record.status === 'skipped') {
    return record;
  }
  if (record.status === 'missed' && !record.completedDate) {
    return record;
  }
  if (record.completedDate) {
    if (record.status === 'completed') {
      return record;
    }
    return {
      ...record,
      status: 'completed',
      updatedAt: new Date().toISOString(),
    };
  }
  const status = resolveSmartStatus(record.dueDate, null, todayDate);
  if (status === record.status) {
    return record;
  }
  return {
    ...record,
    status,
    updatedAt: new Date().toISOString(),
  };
}

export function createSmartHealthHistoryLog(
  userId: string,
  petId: string,
  recordId: string,
  action: SmartHealthHistoryLog['action'],
  meta?: Record<string, string>,
): SmartHealthHistoryLog {
  return {
    id: createLocalId('smart-health-log'),
    userId,
    petId,
    recordId,
    action,
    timestamp: new Date().toISOString(),
    meta,
  };
}

function createHistory(
  userId: string,
  petId: string,
  recordId: string,
  action: SmartHealthHistoryLog['action'],
  meta?: Record<string, string>,
): SmartHealthHistoryLog {
  return createSmartHealthHistoryLog(userId, petId, recordId, action, meta);
}

export function generateBootstrapSchedule(
  input: BootstrapSmartScheduleInput,
): { records: SmartHealthRecord[]; logs: SmartHealthHistoryLog[] } {
  const todayDate = getTodayIsoDateLocal();
  const logs: SmartHealthHistoryLog[] = [];
  const context: CarePlanContext = {
    petType: input.petType,
    dateOfBirth: toIsoDateOnly(input.dateOfBirth),
    nowDate: todayDate,
    region: resolveCarePlanRegion(input.region) as CarePlanContext['region'],
    lifestyleType: input.lifestyleType ?? 'indoor',
    lifestyleRiskLevel: (input.lifestyleRiskLevel ??
      'low') as CarePlanContext['lifestyleRiskLevel'],
  };
  const records = lifecycleEngine.generateInitialPlan({
    userId: input.userId,
    petId: input.petId,
    context,
    lastVaccinationDate: input.lastVaccinationDate,
    lastRabiesDate: input.lastRabiesDate,
    lastDewormingDate: input.lastDewormingDate,
  });
  for (const record of records) {
    logs.push(createHistory(input.userId, input.petId, record.id, 'created'));
  }
  return { records, logs };
}

export function createNextRecurringRecord(
  completed: SmartHealthRecord,
  completedDate: string,
): SmartHealthRecord | null {
  if (completed.recurrenceType === 'none') {
    return null;
  }
  const dueDate =
    completed.type === 'deworming'
      ? completed.cadence === 'every_14_days'
        ? addDays(completedDate, 14)
        : completed.cadence === 'monthly'
        ? addMonths(completedDate, 1)
        : completed.cadence === 'every_2_months'
        ? addMonths(completedDate, 2)
        : addMonths(completedDate, 3)
      : addMonths(
          completedDate,
          completed.recurrenceIntervalMonths ??
            (completed.recurrenceType === 'yearly' ? 12 : 3),
        );
  const nowIso = new Date().toISOString();
  return {
    id:
      completed.type === 'deworming'
        ? `${completed.petId}-deworming-DEWORM_${dueDate}-${dueDate}`
        : createLocalId('smart-health'),
    userId: completed.userId,
    petId: completed.petId,
    type: completed.type,
    key: completed.type === 'deworming' ? `DEWORM_${dueDate}` : completed.key,
    family: completed.family,
    category: completed.category,
    name: completed.name,
    dueDate,
    recommendedDate: dueDate,
    completedDate: null,
    status: resolveSmartStatus(dueDate, null, nowIso.slice(0, 10)),
    isOptional: completed.isOptional,
    recurrenceType: completed.recurrenceType,
    recurrenceIntervalMonths: completed.recurrenceIntervalMonths,
    cadence: completed.cadence,
    riskLevel: completed.riskLevel,
    lifestyleTriggers: completed.lifestyleTriggers,
    doseNumber: completed.doseNumber,
    totalDoses: completed.totalDoses,
    stage: completed.stage,
    dependsOn: null,
    source: completed.source ?? 'system',
    isLocked: false,
    priority: completed.priority,
    contextLabel: completed.contextLabel,
    recovery: { isRecovered: false, recoveredFrom: null },
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function buildCompletionUpdate(
  record: SmartHealthRecord,
  completedDateInput?: string,
): {
  updated: SmartHealthRecord;
  next: SmartHealthRecord | null;
  logs: SmartHealthHistoryLog[];
} {
  const nowIso = new Date().toISOString();
  const completedDate = toIsoDateOnly(completedDateInput ?? nowIso.slice(0, 10));
  const updated: SmartHealthRecord = {
    ...record,
    completedDate,
    status: 'completed',
    recovery:
      completedDate > record.dueDate
        ? {
            isRecovered: true,
            recoveredFrom: record.id,
            recoveryReason: 'late',
          }
        : record.recovery,
    updatedAt: nowIso,
  };
  const next =
    record.type === 'deworming'
      ? null
      : createNextRecurringRecord(record, completedDate);
  const logs: SmartHealthHistoryLog[] = [
    createHistory(record.userId, record.petId, record.id, 'completed', {
      completedDate,
    }),
  ];
  if (next) {
    logs.push(
      createHistory(record.userId, record.petId, next.id, 'generated_next', {
        sourceRecordId: record.id,
        dueDate: next.dueDate,
      }),
    );
  }
  return { updated, next, logs };
}

export function buildRescheduleUpdate(
  record: SmartHealthRecord,
  newDueDateInput: string,
): { updated: SmartHealthRecord; log: SmartHealthHistoryLog } {
  const newDueDate = toIsoDateOnly(newDueDateInput);
  const nowIso = new Date().toISOString();
  const updated: SmartHealthRecord = {
    ...record,
    dueDate: newDueDate,
    recommendedDate: newDueDate,
    status: resolveSmartStatus(newDueDate, record.completedDate, nowIso.slice(0, 10)),
    recovery: {
      isRecovered: true,
      recoveredFrom: record.id,
      recoveryReason: 'manual_adjustment',
    },
    updatedAt: nowIso,
  };
  return {
    updated,
    log: createHistory(record.userId, record.petId, record.id, 'rescheduled', {
      dueDate: newDueDate,
    }),
  };
}

