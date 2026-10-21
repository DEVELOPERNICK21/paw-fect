import type { DailyCareBlock } from '../../../domain/models/DailyCareBlock';
import {
  buildWellnessDigestCandidates,
  buildWellnessDigestCopy,
  pickWellnessDigestBlocks,
} from '../wellnessDigestNotificationSync';

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
    order: partial.order ?? 1,
    ...partial,
  };
}

describe('pickWellnessDigestBlocks', () => {
  it('picks morning, midday, and evening slots', () => {
    const blocks = [
      block({ id: 'm', scheduledTime: '07:00', order: 1, title: 'Morning walk' }),
      block({ id: 'mid', scheduledTime: '12:00', order: 2, category: 'litter', title: 'Midday litter scoop' }),
      block({ id: 'eve', scheduledTime: '20:00', order: 3, category: 'grooming', title: 'Grooming + health check' }),
      block({ id: 'bed', scheduledTime: '22:30', order: 4, category: 'bedtime', title: 'Bedtime' }),
    ];
    const slots = pickWellnessDigestBlocks(blocks);
    expect(slots.morning?.id).toBe('m');
    expect(slots.midday?.id).toBe('mid');
    expect(slots.evening?.id).toBe('eve');
  });

  it('skips done blocks', () => {
    const blocks = [
      block({ id: 'm', scheduledTime: '07:00', status: 'done', isCompleted: true }),
      block({ id: 'mid', scheduledTime: '12:00', category: 'litter' }),
    ];
    const slots = pickWellnessDigestBlocks(blocks);
    expect(slots.morning?.id).toBe('mid');
  });
});

describe('buildWellnessDigestCandidates', () => {
  const blocks = [
    block({ id: 'm', scheduledTime: '07:00', order: 1, title: 'Morning walk' }),
    block({ id: 'mid', scheduledTime: '12:00', order: 2, category: 'litter', title: 'Midday litter scoop' }),
    block({ id: 'eve', scheduledTime: '20:00', order: 3, category: 'grooming', title: 'Grooming + health check' }),
  ];

  it('builds lowest-priority candidates 15 minutes before each slot', () => {
    const nowMs = new Date(2026, 9, 1, 6, 0).getTime();
    const candidates = buildWellnessDigestCandidates('2026-10-01', 'p1', 'Bruno', blocks, nowMs);

    expect(candidates.map(c => c.id)).toEqual([
      'wellness-digest-p1-morning',
      'wellness-digest-p1-midday',
      'wellness-digest-p1-evening',
    ]);
    expect(candidates.every(c => c.kind === 'wellnessDigest' && c.priority === 5)).toBe(true);
    expect(candidates[0]?.fireAt).toEqual(new Date(2026, 9, 1, 6, 45));
  });

  it('skips slots whose fire time has passed', () => {
    const nowMs = new Date(2026, 9, 1, 13, 0).getTime();
    const candidates = buildWellnessDigestCandidates('2026-10-01', 'p1', 'Bruno', blocks, nowMs);

    expect(candidates.map(c => c.id)).toEqual(['wellness-digest-p1-evening']);
  });
});

describe('buildWellnessDigestCopy', () => {
  it('personalizes morning walk copy', () => {
    const copy = buildWellnessDigestCopy(
      'morning',
      'Bruno',
      block({ title: 'Morning walk + potty break' }),
    );
    expect(copy.title).toContain('Bruno');
    expect(copy.title).toContain('walk');
  });

  it('personalizes litter midday copy', () => {
    const copy = buildWellnessDigestCopy(
      'midday',
      'Luna',
      block({ category: 'litter', title: 'Midday litter scoop' }),
    );
    expect(copy.title).toContain('Luna');
    expect(copy.title).toContain('litter');
  });
});
