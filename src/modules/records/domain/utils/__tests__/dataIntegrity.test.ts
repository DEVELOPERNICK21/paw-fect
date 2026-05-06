import type { SmartHealthRecord } from '../../models/SmartHealthRecord';
import { getLastCompletedDewormingIsoDate } from '../smartHealthDewormingInference';

const deworm = (overrides: Partial<SmartHealthRecord>): SmartHealthRecord =>
  ({
    id: 'r0',
    userId: 'u',
    petId: 'p',
    type: 'deworming',
    name: 'Deworming',
    dueDate: '2026-01-01',
    completedDate: null,
    status: 'upcoming',
    recurrenceType: 'quarterly',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }) as SmartHealthRecord;

describe('data integrity (smart health deworming inference)', () => {
  it('INT-01: picks latest completion by calendar date, not insertion order', () => {
    const records = [
      deworm({
        id: 'old-insert',
        status: 'completed',
        completedDate: '2025-06-01',
      }),
      deworm({
        id: 'newer',
        status: 'completed',
        completedDate: '2025-09-15',
      }),
      deworm({
        id: 'oldest-insert-first',
        status: 'completed',
        completedDate: '2025-03-01',
      }),
    ];
    expect(getLastCompletedDewormingIsoDate(records)).toBe('2025-09-15');
  });

  it('INT-02: deduplicates identical completion dates before choosing baseline', () => {
    const records = [
      deworm({
        id: 'a',
        status: 'completed',
        completedDate: '2025-06-01T12:00:00.000Z',
      }),
      deworm({
        id: 'b',
        status: 'completed',
        completedDate: '2025-06-01',
      }),
    ];
    expect(getLastCompletedDewormingIsoDate(records)).toBe('2025-06-01');
  });

  it('excludes current record id for self-reference (D-LOG-09)', () => {
    const records = [
      deworm({
        id: 'self',
        status: 'completed',
        completedDate: '2025-08-01',
      }),
      deworm({
        id: 'prior',
        status: 'completed',
        completedDate: '2025-06-01',
      }),
    ];
    expect(getLastCompletedDewormingIsoDate(records, 'self')).toBe('2025-06-01');
  });
});
