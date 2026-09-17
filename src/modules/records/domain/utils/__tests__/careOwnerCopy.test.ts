import {
  buildCareOwnerCopy,
  careWhatLabel,
  careWhatToDoLine,
  careWhyLine,
  healthStatusHeadline,
  whySeeingThisBody,
} from '../careOwnerCopy';
import type { SmartHealthRecord } from '../../models/SmartHealthRecord';

const baseRecord = (
  overrides: Partial<SmartHealthRecord>,
): SmartHealthRecord =>
  ({
    id: '1',
    userId: 'u',
    petId: 'p',
    type: 'vaccination',
    name: 'DHPP (1st)',
    family: 'DHPP',
    category: 'core',
    dueDate: '2026-10-12',
    completedDate: null,
    status: 'upcoming',
    recurrenceType: 'none',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }) as SmartHealthRecord;

describe('careOwnerCopy', () => {
  it('labels core dog vaccine without DHPP code', () => {
    expect(careWhatLabel(baseRecord({}))).toMatch(/Core vaccine/i);
    expect(careWhatLabel(baseRecord({}))).not.toMatch(/DHPP/i);
  });

  it('labels deworming as worm medicine', () => {
    expect(
      careWhatLabel(
        baseRecord({ type: 'deworming', name: 'Deworming', family: undefined }),
      ),
    ).toBe('Worm medicine');
  });

  it('labels rabies simply', () => {
    expect(
      careWhatLabel(
        baseRecord({ name: 'Rabies', family: 'Rabies', category: 'core' }),
      ),
    ).toBe('Rabies vaccine');
  });

  it('builds why and what-to-do lines', () => {
    const worm = baseRecord({
      type: 'deworming',
      name: 'Deworming',
      family: undefined,
    });
    expect(careWhyLine(worm)).toMatch(/worms/i);
    expect(careWhatToDoLine(worm, 'Bruno')).toMatch(/Bruno/);
    expect(buildCareOwnerCopy(worm, 'Bruno').what).toBe('Worm medicine');
  });

  it('status headline stays calm — overdue has no banner line', () => {
    expect(healthStatusHeadline({ overdueCount: 1, needsNextCount: 2 })).toBe(
      null,
    );
    expect(healthStatusHeadline({ overdueCount: 0, needsNextCount: 0 })).toBe(
      "You're on track",
    );
    expect(healthStatusHeadline({ overdueCount: 0, needsNextCount: 2 })).toBe(
      'Coming up soon',
    );
  });

  it('why body mentions age and vet', () => {
    const body = whySeeingThisBody({
      petName: 'Bruno',
      ageLabel: '4 months old',
    });
    expect(body).toMatch(/Bruno is 4 months old/);
    expect(body).toMatch(/vet decides/i);
  });
});
