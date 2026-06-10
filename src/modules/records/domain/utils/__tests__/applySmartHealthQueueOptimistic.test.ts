import type { SmartHealthRecord } from '../../models/SmartHealthRecord';
import { applySmartHealthQueueOptimistic } from '../applySmartHealthQueueOptimistic';
import type { SmartHealthQueueEntry } from '../../models/SmartHealthQueueEntry';

function makeRecord(
  id: string,
  status: SmartHealthRecord['status'] = 'upcoming',
): SmartHealthRecord {
  return {
    id,
    userId: 'user-1',
    petId: 'pet-1',
    type: 'deworming',
    name: 'Deworming',
    dueDate: '2026-06-10',
    completedDate: null,
    status,
    recurrenceType: 'quarterly',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeQueueEntry(
  op: SmartHealthQueueEntry['op'],
  record: SmartHealthRecord,
  extra: Partial<SmartHealthQueueEntry> = {},
): SmartHealthQueueEntry {
  return {
    id: 'q-1',
    op,
    petId: record.petId,
    recordId: record.id,
    record,
    enqueuedAt: '2026-06-08T10:00:00.000Z',
    ...extra,
  };
}

describe('applySmartHealthQueueOptimistic', () => {
  it('marks a queued dose as completed with syncPending', () => {
    const record = makeRecord('rec-1', 'overdue');
    const result = applySmartHealthQueueOptimistic(
      [record],
      [
        makeQueueEntry('markDone', record, {
          completedDate: '2026-06-08',
        }),
      ],
    );

    expect(result[0]?.status).toBe('completed');
    expect(result[0]?.completedDate).toBe('2026-06-08');
    expect(result[0]?.syncPending).toBe(true);
  });

  it('applies skip and reschedule queue entries', () => {
    const record = makeRecord('rec-2', 'upcoming');
    const skipped = applySmartHealthQueueOptimistic(
      [record],
      [makeQueueEntry('skip', record, { reason: 'Pet refused tablet' })],
    );
    expect(skipped[0]?.status).toBe('skipped');
    expect(skipped[0]?.skipReason).toBe('Pet refused tablet');

    const rescheduled = applySmartHealthQueueOptimistic(
      [record],
      [makeQueueEntry('reschedule', record, { newDueDate: '2026-07-01' })],
    );
    expect(rescheduled[0]?.dueDate).toBe('2026-07-01');
    expect(rescheduled[0]?.syncPending).toBe(true);
  });
});
