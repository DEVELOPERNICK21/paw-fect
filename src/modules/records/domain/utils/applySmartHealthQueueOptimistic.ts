import type { SmartHealthRecord } from '../models/SmartHealthRecord';
import type { SmartHealthQueueEntry } from '../models/SmartHealthQueueEntry';
import {
  buildCompletionUpdate,
  buildRescheduleUpdate,
} from './SmartHealthScheduleUtils';

function patchRecord(
  records: SmartHealthRecord[],
  recordId: string,
  patch: SmartHealthRecord,
): SmartHealthRecord[] {
  const index = records.findIndex(r => r.id === recordId);
  if (index === -1) {
    return records;
  }
  const next = [...records];
  next[index] = { ...patch, syncPending: true };
  return next;
}

function applyQueueEntry(
  records: SmartHealthRecord[],
  entry: SmartHealthQueueEntry,
): SmartHealthRecord[] {
  const record = records.find(r => r.id === entry.recordId) ?? entry.record;

  switch (entry.op) {
    case 'markDone': {
      const { updated, next } = buildCompletionUpdate(record, entry.completedDate);
      let result = patchRecord(records, entry.recordId, updated);
      if (next && !result.some(r => r.id === next.id)) {
        result = [...result, { ...next, syncPending: true }];
      }
      return result;
    }
    case 'skip':
      return patchRecord(records, entry.recordId, {
        ...record,
        status: 'skipped',
        skipReason: entry.reason?.trim() ?? '',
        updatedAt: new Date().toISOString(),
      });
    case 'reschedule': {
      if (!entry.newDueDate) {
        return records;
      }
      const { updated } = buildRescheduleUpdate(record, entry.newDueDate);
      return patchRecord(records, entry.recordId, updated);
    }
    default:
      return records;
  }
}

/**
 * Applies pending outbound queue entries onto a record list for offline-first UX.
 * Client-only `syncPending` flags are stripped before persisting to Firestore.
 */
export function applySmartHealthQueueOptimistic(
  records: SmartHealthRecord[],
  queueEntries: SmartHealthQueueEntry[],
): SmartHealthRecord[] {
  if (queueEntries.length === 0) {
    return records;
  }

  const sorted = [...queueEntries].sort(
    (a, b) =>
      new Date(a.enqueuedAt).getTime() - new Date(b.enqueuedAt).getTime(),
  );

  return sorted.reduce(
    (acc, entry) => applyQueueEntry(acc, entry),
    records,
  );
}

export function stripSmartHealthSyncPending(
  records: SmartHealthRecord[],
): SmartHealthRecord[] {
  return records.map(({ syncPending: _syncPending, ...record }) => record);
}
