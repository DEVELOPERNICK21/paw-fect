import type {
  DewormingSchedule,
  DewormingRecord,
  DewormingStatusResult,
} from '../models/SmartHealthRecord';

const DAY_MS = 24 * 60 * 60 * 1000;

const toDateOnly = (date: string): Date => {
  const d = new Date(`${date}T00:00:00`);
  return d;
};

const daysBetween = (from: string, to: string): number => {
  const fromDate = toDateOnly(from);
  const toDate = toDateOnly(to);
  return Math.floor((toDate.getTime() - fromDate.getTime()) / DAY_MS);
};

/**
 * Compute deworming status - NOT stored, computed at read time
 *
 * Rules:
 * - If actualDate exists in DewormingRecord → completed
 * - If dueDate < today → overdue (if not completed)
 * - If dueDate >= today → pending
 * - If dueDate < today - 30 days → missed
 */
export function computeDewormingStatus(
  schedule: DewormingSchedule,
  records: DewormingRecord[],
): DewormingStatusResult {
  const today = new Date().toISOString().slice(0, 10);

  // Find record linked to this schedule or with matching date
  const matchingRecord = records.find(
    r => r.scheduleId === schedule.id || r.actualDate === schedule.dueDate,
  );

  if (matchingRecord) {
    return {
      scheduleId: schedule.id,
      status: 'completed',
      completedRecord: matchingRecord,
      daysOverdue: null,
    };
  }

  const daysOverdue = daysBetween(schedule.dueDate, today);

  if (daysOverdue > 30) {
    return {
      scheduleId: schedule.id,
      status: 'missed',
      completedRecord: null,
      daysOverdue,
    };
  }

  if (daysOverdue > 0) {
    return {
      scheduleId: schedule.id,
      status: 'overdue',
      completedRecord: null,
      daysOverdue,
    };
  }

  return {
    scheduleId: schedule.id,
    status: 'pending',
    completedRecord: null,
    daysOverdue: null,
  };
}

/**
 * Get all schedule statuses for a pet
 */
export function computeAllDewormingStatuses(
  schedules: DewormingSchedule[],
  records: DewormingRecord[],
): DewormingStatusResult[] {
  return schedules
    .slice()
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    .map(schedule => computeDewormingStatus(schedule, records));
}

/**
 * Get the next upcoming deworming task
 */
export function getNextDewormingTask(
  schedules: DewormingSchedule[],
  records: DewormingRecord[],
): DewormingSchedule | null {
  const statuses = computeAllDewormingStatuses(schedules, records);

  // Find first non-completed
  const nextPending = statuses.find(s => s.status !== 'completed');
  if (!nextPending) return null;

  return schedules.find(s => s.id === nextPending.scheduleId) ?? null;
}

/**
 * Check if schedule needs regeneration
 * (if pet DOB changed since generation)
 */
export function needsRegeneration(
  schedule: DewormingSchedule,
  currentPetDob: string,
): boolean {
  return schedule.sourcePetDob !== currentPetDob;
}
