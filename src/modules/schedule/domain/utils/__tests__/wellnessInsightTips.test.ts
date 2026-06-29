import type { DailyCareBlock } from '../../models/DailyCareBlock';
import { resolveInsightTip } from '../wellnessInsightTips';

function block(partial: Partial<DailyCareBlock>): DailyCareBlock {
  return {
    id: '1',
    petId: 'p1',
    category: 'walk',
    title: 'Morning walk',
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

describe('resolveInsightTip', () => {
  it('returns morning walk tip for dogs', () => {
    const tip = resolveInsightTip(
      block({ category: 'walk', title: 'Morning walk + potty break' }),
      'dog',
    );
    expect(tip).toContain('circadian rhythm');
  });

  it('returns post-meal potty tip for dogs', () => {
    const tip = resolveInsightTip(
      block({ category: 'potty', title: 'Post-meal potty break' }),
      'dog',
    );
    expect(tip).toContain('gastrocolic reflex');
  });

  it('returns play-before-feeding tip for cats', () => {
    const tip = resolveInsightTip(
      block({ category: 'play', title: 'Play session (hunt simulation)' }),
      'cat',
    );
    expect(tip).toContain('hunt before eating');
  });

  it('returns litter scoop tip for cats', () => {
    const tip = resolveInsightTip(
      block({ category: 'litter', title: 'Midday litter scoop' }),
      'cat',
    );
    expect(tip).toContain('dirty litter box');
  });

  it('returns grooming health tip for both species', () => {
    const grooming = block({
      category: 'grooming',
      title: 'Grooming + bonding + health check',
    });
    expect(resolveInsightTip(grooming, 'dog')).toContain('Early detection');
    expect(resolveInsightTip(grooming, 'cat')).toContain('Early detection');
  });
});
