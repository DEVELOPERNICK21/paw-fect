import type { SmartHealthRecord } from '../../../modules/records/domain/models/SmartHealthRecord';
import {
  computeSmartHealthNotificationCoverage,
  selectHealthRecordsForNotifications,
} from '../smartHealthNotificationSelection';

function makeRecord(
  id: string,
  petId: string,
  dueDate: string,
  status: SmartHealthRecord['status'] = 'upcoming',
): SmartHealthRecord {
  return {
    id,
    userId: 'user-1',
    petId,
    type: 'deworming',
    name: 'Deworming',
    dueDate,
    completedDate: null,
    status,
    recurrenceType: 'none',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('selectHealthRecordsForNotifications', () => {
  it('round-robins across pets instead of filling only the first pet', () => {
    const records = [
      ...Array.from({ length: 8 }, (_, i) =>
        makeRecord(`a-${i}`, 'pet-a', `2026-06-${String(i + 1).padStart(2, '0')}`),
      ),
      ...Array.from({ length: 8 }, (_, i) =>
        makeRecord(`b-${i}`, 'pet-b', `2026-06-${String(i + 1).padStart(2, '0')}`),
      ),
      ...Array.from({ length: 8 }, (_, i) =>
        makeRecord(`c-${i}`, 'pet-c', `2026-06-${String(i + 1).padStart(2, '0')}`),
      ),
    ];

    const selected = selectHealthRecordsForNotifications(records, {
      maxPerPet: 4,
      maxTotal: 12,
    });

    const byPet = selected.reduce<Record<string, number>>((acc, r) => {
      acc[r.petId] = (acc[r.petId] ?? 0) + 1;
      return acc;
    }, {});

    expect(selected).toHaveLength(12);
    expect(byPet['pet-a']).toBe(4);
    expect(byPet['pet-b']).toBe(4);
    expect(byPet['pet-c']).toBe(4);
  });

  it('prioritizes overdue rows within each pet', () => {
    const records = [
      makeRecord('upcoming', 'pet-a', '2026-08-01', 'upcoming'),
      makeRecord('overdue', 'pet-a', '2026-05-01', 'overdue'),
    ];

    const selected = selectHealthRecordsForNotifications(records, {
      maxPerPet: 1,
      maxTotal: 1,
    });

    expect(selected).toHaveLength(1);
    expect(selected[0]?.id).toBe('overdue');
  });

  it('excludes locked rows from scheduling', () => {
    const records = [
      makeRecord('locked', 'pet-a', '2026-06-01', 'locked'),
      makeRecord('open', 'pet-a', '2026-06-02', 'upcoming'),
    ];

    const selected = selectHealthRecordsForNotifications(records);
    expect(selected.map(r => r.id)).toEqual(['open']);
  });
});

describe('computeSmartHealthNotificationCoverage', () => {
  it('reports capped state when not all schedulable rows fit', () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord(`r-${i}`, 'pet-a', `2026-06-${String(i + 1).padStart(2, '0')}`),
    );

    const coverage = computeSmartHealthNotificationCoverage(records, {
      maxPerPet: 3,
      maxTotal: 3,
    });

    expect(coverage.totalSchedulable).toBe(10);
    expect(coverage.scheduledCount).toBe(3);
    expect(coverage.capped).toBe(true);
    expect(coverage.byPet['pet-a']).toEqual({ schedulable: 10, scheduled: 3 });
  });
});
