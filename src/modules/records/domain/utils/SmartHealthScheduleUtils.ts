import { createLocalId } from '../../../../shared/utils/id';
import type {
  BootstrapSmartScheduleInput,
  SmartHealthHistoryLog,
  SmartHealthRecord,
  SmartHealthRecordStatus,
  SmartHealthRecordType,
} from '../models/SmartHealthRecord';

const ISO_DATE_ONLY_LENGTH = 10;
const LOCK_WINDOW_DAYS = 30;

const VAC_DOG_TIMELINE: Array<{ weeks: number; name: string; isOptional?: boolean }> = [
  { weeks: 7, name: 'DHPP (1st)' },
  { weeks: 10, name: 'DHPP (2nd)' },
  { weeks: 13, name: 'DHPP (3rd)' },
  { weeks: 13, name: 'Rabies' },
  { weeks: 16, name: 'DHPP (Optional booster)', isOptional: true },
];

const VAC_CAT_TIMELINE: Array<{ weeks: number; name: string; isOptional?: boolean }> = [
  { weeks: 7, name: 'FVRCP (1st)' },
  { weeks: 10, name: 'FVRCP (2nd)' },
  { weeks: 13, name: 'FVRCP (3rd)' },
  { weeks: 13, name: 'Rabies' },
];

function toIsoDateOnly(input: string): string {
  if (!input) return input;
  if (input.length >= ISO_DATE_ONLY_LENGTH) {
    return input.slice(0, ISO_DATE_ONLY_LENGTH);
  }
  return input;
}

function addDays(dateOnly: string, days: number): string {
  const d = new Date(`${dateOnly}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function addMonths(dateOnly: string, months: number): string {
  const d = new Date(`${dateOnly}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function daysBetween(fromDate: string, toDate: string): number {
  const from = new Date(`${fromDate}T00:00:00`).getTime();
  const to = new Date(`${toDate}T00:00:00`).getTime();
  return Math.floor((to - from) / (24 * 60 * 60 * 1000));
}

function yearsBetweenDobAndNow(dateOfBirth: string): number {
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const monthDelta = now.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) {
    years -= 1;
  }
  return Math.max(0, years);
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

function createRecord(params: {
  userId: string;
  petId: string;
  type: SmartHealthRecordType;
  name: string;
  dueDate: string;
  recurrenceType: SmartHealthRecord['recurrenceType'];
  isOptional?: boolean;
  nowIso: string;
  todayDate: string;
}): SmartHealthRecord {
  const record: SmartHealthRecord = {
    id: createLocalId('smart-health'),
    userId: params.userId,
    petId: params.petId,
    type: params.type,
    name: params.name,
    dueDate: params.dueDate,
    completedDate: null,
    status: 'upcoming',
    isOptional: params.isOptional,
    recurrenceType: params.recurrenceType,
    createdAt: params.nowIso,
    updatedAt: params.nowIso,
  };
  return normalizeSmartRecordStatus(record, params.todayDate);
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
  const dateOfBirth = toIsoDateOnly(input.dateOfBirth);
  const nowIso = new Date().toISOString();
  const todayDate = nowIso.slice(0, 10);
  const petAgeYears = yearsBetweenDobAndNow(dateOfBirth);

  const logs: SmartHealthHistoryLog[] = [];
  const records: SmartHealthRecord[] = [];

  const pushRecord = (record: SmartHealthRecord): void => {
    records.push(record);
    logs.push(createHistory(input.userId, input.petId, record.id, 'created'));
  };

  if (petAgeYears >= 1) {
    // Adult onboarding: only last vaccination + last deworming dates required.
    const lastVaccinationDate = toIsoDateOnly(input.lastVaccinationDate ?? todayDate);
    const lastDewormingDate = toIsoDateOnly(input.lastDewormingDate ?? todayDate);

    pushRecord(
      createRecord({
        userId: input.userId,
        petId: input.petId,
        type: 'vaccination',
        name: 'Yearly Booster',
        dueDate: addMonths(lastVaccinationDate, 12),
        recurrenceType: 'yearly',
        nowIso,
        todayDate,
      }),
    );
    pushRecord(
      createRecord({
        userId: input.userId,
        petId: input.petId,
        type: 'deworming',
        name: 'Deworming',
        dueDate: addMonths(lastDewormingDate, 3),
        recurrenceType: 'quarterly',
        nowIso,
        todayDate,
      }),
    );
    return { records, logs };
  }

  const vacTimeline =
    input.petType === 'dog' ? VAC_DOG_TIMELINE : VAC_CAT_TIMELINE;
  for (const row of vacTimeline) {
    pushRecord(
      createRecord({
        userId: input.userId,
        petId: input.petId,
        type: 'vaccination',
        name: row.name,
        dueDate: addDays(dateOfBirth, row.weeks * 7),
        isOptional: row.isOptional,
        recurrenceType: 'none',
        nowIso,
        todayDate,
      }),
    );
  }

  // First annual booster recurrence from 1-year mark.
  pushRecord(
    createRecord({
      userId: input.userId,
      petId: input.petId,
      type: 'vaccination',
      name: 'Booster (Yearly)',
      dueDate: addMonths(dateOfBirth, 12),
      recurrenceType: 'yearly',
      nowIso,
      todayDate,
    }),
  );

  // Deworming lifecycle:
  // - every 2 weeks until 3 months
  // - monthly until 6 months
  // - then quarterly
  const dewormingDueDates: string[] = [];
  let biweekly = addDays(dateOfBirth, 14);
  const threeMonths = addMonths(dateOfBirth, 3);
  while (biweekly <= threeMonths) {
    dewormingDueDates.push(biweekly);
    biweekly = addDays(biweekly, 14);
  }

  let monthly = addMonths(threeMonths, 1);
  const sixMonths = addMonths(dateOfBirth, 6);
  while (monthly <= sixMonths) {
    dewormingDueDates.push(monthly);
    monthly = addMonths(monthly, 1);
  }

  for (const dueDate of dewormingDueDates) {
    pushRecord(
      createRecord({
        userId: input.userId,
        petId: input.petId,
        type: 'deworming',
        name: 'Deworming',
        dueDate,
        recurrenceType: 'none',
        nowIso,
        todayDate,
      }),
    );
  }

  pushRecord(
    createRecord({
      userId: input.userId,
      petId: input.petId,
      type: 'deworming',
      name: 'Deworming',
      dueDate: addMonths(sixMonths, 3),
      recurrenceType: 'quarterly',
      nowIso,
      todayDate,
    }),
  );

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
    status: resolveSmartStatus(newDueDate, record.completedDate, nowIso.slice(0, 10)),
    updatedAt: nowIso,
  };
  return {
    updated,
    log: createHistory(record.userId, record.petId, record.id, 'rescheduled', {
      dueDate: newDueDate,
    }),
  };
}

