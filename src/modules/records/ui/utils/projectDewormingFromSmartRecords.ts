import type { SmartHealthRecord } from '../../domain/models/SmartHealthRecord';

/** Lower = higher priority for “what should I do next?” */
function actionablePriority(status: SmartHealthRecord['status']): number {
  if (status === 'overdue') return 0;
  if (status === 'missed') return 1;
  if (status === 'upcoming') return 2;
  return 99;
}

/**
 * Derives deworming UI sections from persisted smart rows only (no parallel timeline engine).
 */
export function projectDewormingFromSmartRecords(
  dewormingRecords: SmartHealthRecord[],
): {
  primary: SmartHealthRecord | null;
  upcoming: SmartHealthRecord[];
  history: SmartHealthRecord[];
} {
  const sorted = dewormingRecords
    .slice()
    .sort(
      (a, b) =>
        a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id),
    );

  const actionable = sorted.filter(
    r =>
      r.status === 'overdue' ||
      r.status === 'missed' ||
      r.status === 'upcoming',
  );

  actionable.sort((a, b) => {
    const pa = actionablePriority(a.status);
    const pb = actionablePriority(b.status);
    if (pa !== pb) return pa - pb;
    return a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id);
  });

  const primary = actionable[0] ?? null;

  const upcoming = sorted.filter(
    r => r.status === 'upcoming' && r.id !== primary?.id,
  );

  const history = sorted
    .filter(r => r.status === 'completed' || r.status === 'skipped')
    .sort((a, b) => {
      const ad = (a.completedDate ?? a.dueDate).slice(0, 10);
      const bd = (b.completedDate ?? b.dueDate).slice(0, 10);
      return bd.localeCompare(ad) || a.id.localeCompare(b.id);
    });

  return { primary, upcoming, history };
}
