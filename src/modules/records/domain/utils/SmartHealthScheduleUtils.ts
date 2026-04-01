import type {
  BootstrapSmartScheduleInput,
  SmartHealthHistoryLog,
  SmartHealthRecord,
  SmartHealthRecordStatus,
} from '../models/SmartHealthRecord';
import { createLocalId } from '../../../../shared/utils/id';
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
  const status = resolveSmartStatus(record.dueDate, record.completedDate, todayDate);
  if (status === record.status) {
    return record;
  }
  return {
    ...record,
    status,
    updatedAt: new Date().toISOString(),
  };
}

function createHistory(
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

export function generateBootstrapSchedule(
  input: BootstrapSmartScheduleInput,
): { records: SmartHealthRecord[]; logs: SmartHealthHistoryLog[] } {
  const nowIso = new Date().toISOString();
  const todayDate = nowIso.slice(0, 10);
  const logs: SmartHealthHistoryLog[] = [];
  const context: CarePlanContext = {
    petType: input.petType,
    dateOfBirth: toIsoDateOnly(input.dateOfBirth),
    nowDate: todayDate,
    region: input.region ?? 'OTHER',
    lifestyleType: input.lifestyleType ?? 'indoor',
    lifestyleRiskLevel: input.lifestyleRiskLevel ?? 'low',
  };
  const records = lifecycleEngine.generateInitialPlan({
    userId: input.userId,
    petId: input.petId,
    context,
    lastVaccinationDate: input.lastVaccinationDate,
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
    completed.recurrenceType === 'yearly'
      ? addMonths(completedDate, 12)
      : addMonths(completedDate, 3);
  const nowIso = new Date().toISOString();
  return {
    id: createLocalId('smart-health'),
    userId: completed.userId,
    petId: completed.petId,
    type: completed.type,
    name: completed.name,
    dueDate,
    completedDate: null,
    status: resolveSmartStatus(dueDate, null, nowIso.slice(0, 10)),
    isOptional: completed.isOptional,
    recurrenceType: completed.recurrenceType,
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
  const next = createNextRecurringRecord(record, completedDate);
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

