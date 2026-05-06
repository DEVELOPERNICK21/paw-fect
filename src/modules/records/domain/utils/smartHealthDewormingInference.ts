import type { SmartHealthRecord } from '../models/SmartHealthRecord';
import { toIsoDateOnly } from './healthRecordDateGuards';

/**
 * Latest completion date for deworming, for spacing validation.
 * Sorts by calendar date descending, deduplicates identical dates, excludes optional row (self-reference).
 */
export function getLastCompletedDewormingIsoDate(
  records: readonly SmartHealthRecord[],
  excludeRecordId?: string,
): string | undefined {
  const dates = records
    .filter(
      r =>
        r.type === 'deworming' &&
        r.status === 'completed' &&
        (excludeRecordId === undefined || r.id !== excludeRecordId),
    )
    .map(r => {
      const raw = r.completedDate ?? r.dueDate;
      return raw ? toIsoDateOnly(raw) : '';
    })
    .filter(d => d.length >= 10);

  const unique = [...new Set(dates)].sort((a, b) => b.localeCompare(a));
  return unique[0];
}
