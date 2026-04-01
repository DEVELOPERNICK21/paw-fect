import type { SmartHealthRecord } from '../../domain/models/SmartHealthRecord';

export interface PartitionedCareRecords {
  overdue: SmartHealthRecord[];
  dueSoon: SmartHealthRecord[];
  futureSchedule: SmartHealthRecord[];
  history: SmartHealthRecord[];
}

/**
 * Splits tab-filtered records into non-overlapping UI groups (no duplicate rows).
 */
export function partitionCareRecordsForUi(
  records: SmartHealthRecord[],
): PartitionedCareRecords {
  const overdue = records
    .filter(r => r.status === 'overdue')
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const dueSoon = records
    .filter(r => r.status === 'upcoming')
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const futureSchedule = records
    .filter(r => r.status === 'locked')
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const history = records
    .filter(r => r.status === 'completed' || r.status === 'missed')
    .slice()
    .sort((a, b) => {
      const ad = a.completedDate ?? a.dueDate;
      const bd = b.completedDate ?? b.dueDate;
      return bd.localeCompare(ad);
    });

  return { overdue, dueSoon, futureSchedule, history };
}

/** First actionable task: most urgent overdue, else earliest due-soon. */
export function pickPrimaryActionTask(
  partitioned: PartitionedCareRecords,
): SmartHealthRecord | null {
  if (partitioned.overdue.length > 0) {
    return partitioned.overdue[0] ?? null;
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
