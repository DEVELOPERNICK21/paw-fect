import type { SmartHealthRecord } from '../../../domain/models/SmartHealthRecord';
import { projectDewormingFromSmartRecords } from '../projectDewormingFromSmartRecords';

const base = (
  overrides: Partial<SmartHealthRecord> &
    Pick<SmartHealthRecord, 'id' | 'dueDate' | 'status'>,
): SmartHealthRecord => ({
  userId: 'u1',
  petId: 'p1',
  type: 'deworming',
  family: 'Deworming',
  name: 'Deworming',
  recommendedDate: overrides.dueDate,
  completedDate: null,
  recurrenceType: 'none',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  recovery: { isRecovered: false, recoveredFrom: null },
  cadence: 'every_14_days',
  ...overrides,
});

describe('projectDewormingFromSmartRecords', () => {
  it('returns empty projection when there are no rows', () => {
    const out = projectDewormingFromSmartRecords([]);
    expect(out.primary).toBeNull();
    expect(out.upcoming).toEqual([]);
    expect(out.history).toEqual([]);
  });

  it('picks overdue before upcoming when due dates overlap ordering', () => {
    const rows = [
      base({
        id: 'a',
        dueDate: '2026-05-01',
        status: 'upcoming',
        key: 'DEWORM_2026-05-01',
      }),
      base({
        id: 'b',
        dueDate: '2026-05-10',
        status: 'overdue',
        key: 'DEWORM_2026-05-10',
      }),
    ];
    const out = projectDewormingFromSmartRecords(rows);
    expect(out.primary?.id).toBe('b');
    expect(out.upcoming.map(r => r.id)).toEqual(['a']);
  });

  it('lists only upcoming (excluding primary) in upcoming section', () => {
    const rows = [
      base({
        id: 'p1',
        dueDate: '2026-05-01',
        status: 'overdue',
        key: 'DEWORM_2026-05-01',
      }),
      base({
        id: 'p2',
        dueDate: '2026-05-15',
        status: 'upcoming',
        key: 'DEWORM_2026-05-15',
      }),
      base({
        id: 'p3',
        dueDate: '2026-06-01',
        status: 'upcoming',
        key: 'DEWORM_2026-06-01',
      }),
    ];
    const out = projectDewormingFromSmartRecords(rows);
    expect(out.primary?.id).toBe('p1');
    expect(out.upcoming.map(r => r.id)).toEqual(['p2', 'p3']);
  });

  it('sorts history by completion/log date descending', () => {
    const rows = [
      base({
        id: 'h1',
        dueDate: '2026-03-01',
        status: 'completed',
        completedDate: '2026-03-02',
        key: 'DEWORM_2026-03-01',
      }),
      base({
        id: 'h2',
        dueDate: '2026-04-01',
        status: 'skipped',
        completedDate: null,
        skipReason: 'vet advised',
        key: 'DEWORM_2026-04-01',
      }),
    ];
    const out = projectDewormingFromSmartRecords(rows);
    expect(out.history.map(r => r.id)).toEqual(['h2', 'h1']);
  });
});
