import type { DailyCareBlock } from '../../models/DailyCareBlock';
import { getDayCompletion, isDayFullyComplete } from '../wellnessCompletion';

function block(partial: Partial<DailyCareBlock>): DailyCareBlock {
  return {
    id: partial.id ?? '1',
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

describe('getDayCompletion', () => {
  it('excludes pro blocks from total for free users', () => {
    const blocks = [
      block({ id: 'a', status: 'done', isFreeFeature: true }),
      block({ id: 'b', status: 'upcoming', isFreeFeature: false, isProFeature: true }),
    ];
    const result = getDayCompletion(blocks, false);
    expect(result.total).toBe(1);
    expect(result.done).toBe(1);
    expect(result.percentage).toBe(100);
  });

  it('includes all blocks for pro users', () => {
    const blocks = [
      block({ id: 'a', status: 'done' }),
      block({ id: 'b', status: 'upcoming', isFreeFeature: false }),
    ];
    const result = getDayCompletion(blocks, true);
    expect(result.total).toBe(2);
    expect(result.done).toBe(1);
    expect(result.percentage).toBe(50);
  });
});

describe('isDayFullyComplete', () => {
  it('returns true at 100%', () => {
    expect(isDayFullyComplete({ done: 3, total: 3, percentage: 100 })).toBe(true);
  });

  it('returns false below 100%', () => {
    expect(isDayFullyComplete({ done: 2, total: 3, percentage: 67 })).toBe(false);
  });
});
