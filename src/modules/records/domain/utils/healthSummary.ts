import type { SmartHealthRecord } from '../models/SmartHealthRecord';

export type HealthSummaryTone = 'empty' | 'attention' | 'soon' | 'ontrack';

export interface HealthSummary {
  /** Records that count toward progress (locked and skipped doses are excluded). */
  total: number;
  done: number;
  overdue: number;
  /** 0..1 */
  progress: number;
  /** Earliest not-yet-done item that is not overdue, if any. */
  next: SmartHealthRecord | null;
  /** Days from today to `next` (0 = today). Null when there is no next item. */
  daysToNext: number | null;
  tone: HealthSummaryTone;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function dayIndex(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Math.floor(Date.UTC(y, (m ?? 1) - 1, d ?? 1) / DAY_MS);
}

/** At-a-glance health status for one pet. Pure: pass today's local ISO date. */
export function buildHealthSummary(
  records: readonly SmartHealthRecord[],
  todayIso: string,
): HealthSummary {
  const counted = records.filter(
    r => r.status !== 'locked' && r.status !== 'skipped',
  );
  const done = counted.filter(r => r.status === 'completed').length;
  const overdue = counted.filter(
    r => r.status === 'overdue' || r.status === 'missed',
  ).length;

  const next =
    counted
      .filter(r => r.status === 'upcoming')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null;
  const daysToNext =
    next != null ? dayIndex(next.dueDate) - dayIndex(todayIso) : null;

  let tone: HealthSummaryTone;
  if (counted.length === 0) tone = 'empty';
  else if (overdue > 0) tone = 'attention';
  else if (daysToNext != null && daysToNext <= 14) tone = 'soon';
  else tone = 'ontrack';

  return {
    total: counted.length,
    done,
    overdue,
    progress: counted.length > 0 ? done / counted.length : 0,
    next,
    daysToNext,
    tone,
  };
}

export function describeDaysToNext(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days <= 14) return `in ${days} days`;
  if (days <= 60) return `in ${Math.round(days / 7)} weeks`;
  return `in ${Math.round(days / 30)} months`;
}
