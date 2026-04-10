import type { SmartHealthRecord } from '../../domain/models/SmartHealthRecord';

export interface PartitionedCareRecords {
  overdue: SmartHealthRecord[];
  /** Due date equals calendar today (UTC date) */
  dueToday: SmartHealthRecord[];
  dueSoon: SmartHealthRecord[];
  futureSchedule: SmartHealthRecord[];
  history: SmartHealthRecord[];
}

const OPEN_STATUSES = new Set<SmartHealthRecord['status']>([
  'upcoming',
  'overdue',
  'missed',
]);

/**
 * Splits tab-filtered records into non-overlapping UI groups (no duplicate rows).
 */
export function partitionCareRecordsForUi(
  records: SmartHealthRecord[],
  todayIso: string,
): PartitionedCareRecords {
  const overdue = records
    .filter(r => r.status === 'overdue')
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const overdueIds = new Set(overdue.map(r => r.id));

  const dueToday = records
    .filter(
      r =>
        !overdueIds.has(r.id) &&
        OPEN_STATUSES.has(r.status) &&
        r.dueDate === todayIso,
    )
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const usedEarly = new Set([
    ...overdue.map(r => r.id),
    ...dueToday.map(r => r.id),
  ]);

  const dueSoon = records
    .filter(
      r =>
        !usedEarly.has(r.id) &&
        r.status === 'upcoming' &&
        r.dueDate > todayIso &&
        r.dueDate <= addDaysIso(todayIso, 14),
    )
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const usedMid = new Set([
    ...usedEarly,
    ...dueSoon.map(r => r.id),
  ]);

  const futureSchedule = records
    .filter(
      r =>
        !usedMid.has(r.id) &&
        (r.status === 'locked' ||
          (r.status === 'upcoming' && r.dueDate > addDaysIso(todayIso, 14))),
    )
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const history = records
    .filter(
      r =>
        r.status === 'completed' ||
        r.status === 'missed' ||
        r.status === 'skipped',
    )
    .slice()
    .sort((a, b) => {
      const ad = a.completedDate ?? a.dueDate;
      const bd = b.completedDate ?? b.dueDate;
      return bd.localeCompare(ad);
    });

  return { overdue, dueToday, dueSoon, futureSchedule, history };
}

function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** First actionable task: most urgent overdue, else due today, else earliest due-soon. */
export function pickPrimaryActionTask(
  partitioned: PartitionedCareRecords,
): SmartHealthRecord | null {
  if (partitioned.overdue.length > 0) {
    return partitioned.overdue[0] ?? null;
  }
  if (partitioned.dueToday.length > 0) {
    return partitioned.dueToday[0] ?? null;
  }
  if (partitioned.dueSoon.length > 0) {
    return partitioned.dueSoon[0] ?? null;
  }
  return null;
}

export function weeksBetweenDobAndToday(dateOfBirth: string): number | null {
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - dob.getTime();
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}
