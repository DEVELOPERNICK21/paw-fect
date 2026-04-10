import type { SmartHealthRecord } from '../../domain/models/SmartHealthRecord';
import { smartHealthSelectors } from '../smartHealthSelectors';

const baseRecord = (
  id: string,
  overrides: Partial<SmartHealthRecord>,
): SmartHealthRecord => ({
  id,
  userId: 'u1',
  petId: 'p1',
  type: 'vaccination',
  key: id,
  family: 'DHPP',
  category: 'core',
  name: id,
  dueDate: '2026-04-10',
  completedDate: null,
  status: 'upcoming',
  recurrenceType: 'none',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('smartHealthSelectors vaccination priority', () => {
  it('prioritizes overdue over rabies upcoming', () => {
    const records = [
      baseRecord('rabies-upcoming', {
        family: 'Rabies',
        dueDate: '2026-04-15',
        status: 'upcoming',
      }),
      baseRecord('core-overdue', {
        family: 'DHPP',
        dueDate: '2026-04-01',
        status: 'overdue',
      }),
    ];

    const next = smartHealthSelectors.getNextVaccinationTask(records);
    expect(next?.id).toBe('core-overdue');
  });

  it('prioritizes rabies among upcoming vaccinations', () => {
    const records = [
      baseRecord('dhpp-upcoming', {
        family: 'DHPP',
        dueDate: '2026-04-11',
        status: 'upcoming',
      }),
      baseRecord('rabies-upcoming', {
        family: 'Rabies',
        dueDate: '2026-04-13',
        status: 'upcoming',
      }),
    ];

    const next = smartHealthSelectors.getNextVaccinationTask(records);
    expect(next?.id).toBe('rabies-upcoming');
  });

  it('excludes locked/completed from next vaccination', () => {
    const records = [
      baseRecord('locked-rabies', {
        family: 'Rabies',
        status: 'locked',
        dueDate: '2026-06-01',
      }),
      baseRecord('completed-dhpp', {
        family: 'DHPP',
        status: 'completed',
        completedDate: '2026-03-20',
      }),
      baseRecord('upcoming-core', {
        family: 'DHPP',
        status: 'upcoming',
        dueDate: '2026-04-20',
      }),
    ];

    const next = smartHealthSelectors.getNextVaccinationTask(records);
    expect(next?.id).toBe('upcoming-core');
  });

  it('builds upcoming list excluding selected primary task', () => {
    const records = [
      baseRecord('primary-overdue', {
        family: 'DHPP',
        status: 'overdue',
        dueDate: '2026-04-01',
      }),
      baseRecord('coming-rabies', {
        family: 'Rabies',
        status: 'upcoming',
        dueDate: '2026-04-12',
      }),
      baseRecord('coming-dhpp', {
        family: 'DHPP',
        status: 'upcoming',
        dueDate: '2026-04-11',
      }),
    ];

    const upcoming = smartHealthSelectors.getUpcomingVaccinations(records, 5);
    expect(upcoming.map(record => record.id)).toEqual([
      'coming-rabies',
      'coming-dhpp',
    ]);
  });
});
