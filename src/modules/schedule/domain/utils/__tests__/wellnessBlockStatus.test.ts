import type { DailyCareBlock } from '../../models/DailyCareBlock';
import {
  deriveBlockStatus,
  isBlockMissed,
  isWithinActiveWindow,
} from '../wellnessBlockStatus';

function block(partial: Partial<DailyCareBlock>): DailyCareBlock {
  return {
    id: '1',
    petId: 'p1',
    category: 'walk',
    title: 'Walk',
    description: '',
    scheduledTime: '07:00',
    durationMinutes: 20,
    frequency: 'daily',
    reminderEnabled: true,
    reminderMinutesBefore: 0,
    notificationTitle: '',
    notificationBody: '',
    isCompleted: false,
    completedAt: null,
    isFreeFeature: true,
    order: 1,
    ...partial,
  };
}

describe('isWithinActiveWindow', () => {
  it('returns true within ±15 minutes', () => {
    const now = new Date(2026, 5, 9, 7, 10, 0);
    expect(isWithinActiveWindow('07:00', now, 15)).toBe(true);
    expect(isWithinActiveWindow('07:20', now, 15)).toBe(true);
    expect(isWithinActiveWindow('08:00', now, 15)).toBe(false);
  });
});

describe('deriveBlockStatus', () => {
  it('returns done when persisted as done', () => {
    expect(
      deriveBlockStatus(
        block({}),
        { status: 'done', updatedAt: '2026-06-09T07:00:00Z' },
        new Date(2026, 5, 9, 12, 0, 0),
      ),
    ).toBe('done');
  });

  it('returns active within window', () => {
    const now = new Date(2026, 5, 9, 7, 5, 0);
    expect(deriveBlockStatus(block({ scheduledTime: '07:00' }), undefined, now)).toBe(
      'active',
    );
  });

  it('returns upcoming before window', () => {
    const now = new Date(2026, 5, 9, 6, 0, 0);
    expect(deriveBlockStatus(block({ scheduledTime: '07:00' }), undefined, now)).toBe(
      'upcoming',
    );
  });
});

describe('isBlockMissed', () => {
  it('returns true after window passes', () => {
    const b = block({ scheduledTime: '07:00', durationMinutes: 20, status: 'upcoming' });
    const now = new Date(2026, 5, 9, 8, 0, 0);
    expect(isBlockMissed(b, now, false)).toBe(true);
  });

  it('returns false in relaxed mode', () => {
    const b = block({ scheduledTime: '07:00', durationMinutes: 20, status: 'upcoming' });
    const now = new Date(2026, 5, 9, 8, 0, 0);
    expect(isBlockMissed(b, now, true)).toBe(false);
  });
});
