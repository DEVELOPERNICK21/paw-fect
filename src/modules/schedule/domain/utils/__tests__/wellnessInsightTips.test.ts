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
  it('returns plain-language morning walk tip for dogs outside heat/monsoon', () => {
    const tip = resolveInsightTip(
      block({ category: 'walk', title: 'Morning walk + potty break' }),
      'dog',
      '2026-01-15',
    );
    expect(tip).toMatch(/morning walk|settle for the day/i);
    expect(tip).not.toMatch(/circadian/i);
  });

  it('returns monsoon tip for dog walks in Jun–Sep', () => {
    const tip = resolveInsightTip(
      block({ category: 'walk', title: 'Main exercise walk' }),
      'dog',
      '2026-07-10',
    );
    expect(tip).toMatch(/monsoon|Jun–Sep|midday/i);
  });

  it('returns hot-pavement tip for dog walks in summer months', () => {
    const tip = resolveInsightTip(
      block({ category: 'walk', title: 'Morning walk + potty break' }),
      'dog',
      '2026-04-20',
    );
    expect(tip).toMatch(/pavement|summer|heat/i);
  });

  it('returns plain-language post-meal potty tip for dogs', () => {
    const tip = resolveInsightTip(
      block({ category: 'potty', title: 'Post-meal potty break' }),
      'dog',
      '2026-01-15',
    );
    expect(tip).toMatch(/15–30 minutes after eating|accidents/i);
    expect(tip).not.toMatch(/gastrocolic/i);
  });

  it('returns feeding tip for dogs and cats', () => {
    expect(
      resolveInsightTip(block({ category: 'feeding', title: 'Breakfast' }), 'dog'),
    ).toMatch(/walk before feeding|portions|bloat/i);
    expect(
      resolveInsightTip(block({ category: 'feeding', title: 'Breakfast' }), 'cat'),
    ).toMatch(/measured meals|fresh water/i);
  });

  it('returns play-before-feeding tip for cats', () => {
    const tip = resolveInsightTip(
      block({ category: 'play', title: 'Play session (hunt simulation)' }),
      'cat',
    );
    expect(tip).toMatch(/hunt/i);
  });

  it('returns litter scoop tip for cats', () => {
    const tip = resolveInsightTip(
      block({ category: 'litter', title: 'Midday litter scoop' }),
      'cat',
    );
    expect(tip).toMatch(/dirty litter box/i);
  });

  it('returns bedtime tip', () => {
    const tip = resolveInsightTip(
      block({ category: 'bedtime', title: 'Bedtime' }),
      'dog',
    );
    expect(tip).toMatch(/bedtime|sleep/i);
  });

  it('returns free training tip when isFreeFeature', () => {
    const tip = resolveInsightTip(
      block({
        category: 'training',
        title: 'Training + puzzle feeder',
        isFreeFeature: true,
      }),
      'dog',
    );
    expect(tip).toMatch(/commands|kibble|manners/i);
  });

  it('skips training tip when not free', () => {
    const tip = resolveInsightTip(
      block({
        category: 'training',
        title: 'Training + puzzle feeder',
        isFreeFeature: false,
      }),
      'dog',
    );
    expect(tip).toBeUndefined();
  });

  it('returns grooming health tip for both species', () => {
    const grooming = block({
      category: 'grooming',
      title: 'Grooming + bonding + health check',
    });
    expect(resolveInsightTip(grooming, 'dog')).toMatch(/coat|eyes|ears|early/i);
    expect(resolveInsightTip(grooming, 'cat')).toMatch(/coat|eyes|ears|early/i);
  });

  it('returns health_check tip', () => {
    const tip = resolveInsightTip(
      block({ category: 'health_check', title: 'Daily quick health check' }),
      'dog',
    );
    expect(tip).toMatch(/coat|eyes|ears|early/i);
  });
});
