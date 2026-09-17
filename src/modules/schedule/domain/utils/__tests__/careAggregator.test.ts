import type { DailyCareBlock } from '../../models/DailyCareBlock';
import {
  aggregateCareDay,
  chronologicalCareItems,
  resolveCareUrgency,
  resolveWhenLabel,
} from '../careAggregator';

function block(
  partial: Partial<DailyCareBlock> & { id: string; petId: string },
): DailyCareBlock {
  return {
    category: 'walk',
    title: 'Walk',
    description: '',
    scheduledTime: '12:00',
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

describe('careAggregator', () => {
  const pets = [
    { id: 'bruno', name: 'Bruno', type: 'dog' as const },
    { id: 'luna', name: 'Luna', type: 'cat' as const },
  ];

  it('aggregates multiple pets and keeps petId', () => {
    const now = new Date(2026, 8, 17, 10, 0, 0);
    const view = aggregateCareDay({
      pets,
      blocksByPetId: {
        bruno: [block({ id: 'b1', petId: 'bruno', scheduledTime: '18:00' })],
        luna: [block({ id: 'l1', petId: 'luna', scheduledTime: '12:30' })],
      },
      filterPetId: 'all',
      now,
      isPro: true,
    });
    expect(view.items).toHaveLength(2);
    expect(view.items.every(item => item.pet.id === item.block.petId)).toBe(
      true,
    );
    expect(view.attentionItem?.pet.id).toBe('luna');
  });

  it('filters to a single pet without mutating other pets data', () => {
    const now = new Date(2026, 8, 17, 10, 0, 0);
    const blocksByPetId = {
      bruno: [block({ id: 'b1', petId: 'bruno', scheduledTime: '09:00' })],
      luna: [block({ id: 'l1', petId: 'luna', scheduledTime: '10:00' })],
    };
    const view = aggregateCareDay({
      pets,
      blocksByPetId,
      filterPetId: 'bruno',
      now,
      isPro: true,
    });
    expect(view.items).toHaveLength(1);
    expect(view.items[0].pet.id).toBe('bruno');
    expect(blocksByPetId.luna).toHaveLength(1);
  });

  it('sorts overdue before now before upcoming', () => {
    const now = new Date(2026, 8, 17, 12, 0, 0);
    const view = aggregateCareDay({
      pets,
      blocksByPetId: {
        bruno: [
          block({
            id: 'later',
            petId: 'bruno',
            scheduledTime: '20:00',
            durationMinutes: 15,
          }),
          block({
            id: 'overdue',
            petId: 'bruno',
            scheduledTime: '08:00',
            durationMinutes: 15,
          }),
          block({
            id: 'now',
            petId: 'bruno',
            scheduledTime: '12:00',
            durationMinutes: 15,
          }),
        ],
        luna: [],
      },
      filterPetId: 'bruno',
      now,
      relaxedMode: false,
      isPro: true,
    });
    expect(view.attentionItem?.block.id).toBe('overdue');
    expect(view.upNext.map(item => item.block.id)).toEqual(['now', 'later']);
  });

  it('excludes completed from attention and promotes next', () => {
    const now = new Date(2026, 8, 17, 12, 0, 0);
    const view = aggregateCareDay({
      pets,
      blocksByPetId: {
        bruno: [
          block({
            id: 'done',
            petId: 'bruno',
            scheduledTime: '08:00',
            isCompleted: true,
            completedAt: '2026-09-17T08:00:00.000Z',
          }),
          block({ id: 'next', petId: 'bruno', scheduledTime: '13:00' }),
        ],
        luna: [],
      },
      filterPetId: 'all',
      now,
      isPro: true,
    });
    expect(view.attentionItem?.block.id).toBe('next');
    expect(view.doneCount).toBe(1);
    expect(view.openCount).toBe(1);
  });

  it('builds chronological full-day including done', () => {
    const now = new Date(2026, 8, 17, 12, 0, 0);
    const list = chronologicalCareItems({
      pets,
      blocksByPetId: {
        bruno: [
          block({
            id: 'b-late',
            petId: 'bruno',
            scheduledTime: '18:00',
          }),
        ],
        luna: [
          block({
            id: 'l-early',
            petId: 'luna',
            scheduledTime: '09:00',
            isCompleted: true,
            completedAt: 'x',
          }),
        ],
      },
      filterPetId: 'all',
      now,
      isPro: true,
    });
    expect(list.map(item => item.block.id)).toEqual(['l-early', 'b-late']);
  });

  it('labels overdue and now clearly', () => {
    const now = new Date(2026, 8, 17, 12, 30, 0);
    expect(resolveCareUrgency(block({ id: 'a', petId: 'bruno', scheduledTime: '12:30' }), now, false)).toBe(
      'now',
    );
    expect(
      resolveWhenLabel('overdue', '11:00', now),
    ).toContain('ago');
  });
});
