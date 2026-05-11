import type { SmartHealthRecord } from '../../models/SmartHealthRecord';
import { isMilestoneCompletion } from '../isMilestoneCompletion';

function baseRecord(
  overrides: Partial<SmartHealthRecord> = {},
): SmartHealthRecord {
  return {
    id: 'r',
    userId: 'u',
    petId: 'p',
    type: 'vaccination',
    name: 'Vaccine',
    dueDate: '2026-05-22',
    completedDate: '2026-05-11',
    status: 'completed',
    recurrenceType: 'yearly',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('isMilestoneCompletion', () => {
  it('detects final dose of a multi-dose series', () => {
    const completed = baseRecord({
      id: 'c',
      doseNumber: 3,
      totalDoses: 3,
      family: 'DHPP',
    });
    const all: SmartHealthRecord[] = [
      baseRecord({
        id: 'a',
        doseNumber: 1,
        totalDoses: 3,
        family: 'DHPP',
        status: 'completed',
        completedDate: '2026-01-01',
      }),
      baseRecord({
        id: 'b',
        doseNumber: 2,
        totalDoses: 3,
        family: 'DHPP',
        status: 'completed',
        completedDate: '2026-03-01',
      }),
      completed,
    ];
    expect(isMilestoneCompletion(completed, all)).toEqual({
      kind: 'series_complete',
    });
  });

  it('returns null for a mid-series dose', () => {
    const completed = baseRecord({
      doseNumber: 2,
      totalDoses: 3,
      family: 'DHPP',
    });
    expect(isMilestoneCompletion(completed, [completed])).toBeNull();
  });

  it('detects rabies vaccination', () => {
    const completed = baseRecord({
      family: 'Rabies',
      name: 'Rabies booster',
    });
    expect(isMilestoneCompletion(completed, [completed])).toEqual({
      kind: 'rabies_booster',
    });
  });

  it('detects the first-ever completed record for a pet', () => {
    const completed = baseRecord({ id: 'r1', family: undefined });
    expect(isMilestoneCompletion(completed, [completed])).toEqual({
      kind: 'first_ever',
    });
  });

  it('returns null for deworming when prior completions exist', () => {
    const completed = baseRecord({
      id: 'r2',
      type: 'deworming',
      name: 'Deworming',
      family: undefined,
    });
    const all: SmartHealthRecord[] = [
      baseRecord({
        id: 'r1',
        type: 'deworming',
        status: 'completed',
        completedDate: '2025-12-01',
      }),
      completed,
    ];
    expect(isMilestoneCompletion(completed, all)).toBeNull();
  });

  it('returns null when record is not completed', () => {
    const upcoming = baseRecord({ status: 'upcoming', completedDate: null });
    expect(isMilestoneCompletion(upcoming, [upcoming])).toBeNull();
  });
});
