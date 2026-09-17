import type { DailyCareBlock } from '../../models/DailyCareBlock';
import {
  enrichWellnessBlocks,
  resolveHeroBlockId,
  resolveLaterBlocks,
  resolveUpNextBlocks,
} from '../enrichWellnessBlocks';

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

describe('enrichWellnessBlocks NOW/NEXT/LATER', () => {
  it('uses block SSOT completion without taskMap', () => {
    const now = new Date(2026, 8, 17, 6, 0, 0);
    const enriched = enrichWellnessBlocks({
      blocks: [
        block({
          id: 'feed',
          category: 'feeding',
          scheduledTime: '08:00',
          isCompleted: true,
          completedAt: '2026-09-17T08:00:00.000Z',
        }),
        block({ id: 'walk', scheduledTime: '18:30' }),
        block({ id: 'play', category: 'play', scheduledTime: '20:00' }),
      ],
      species: 'dog',
      now,
      relaxedMode: true,
    });
    expect(enriched.find(b => b.id === 'feed')?.status).toBe('done');
    const hero = resolveHeroBlockId(enriched);
    expect(hero).toBe('walk');
    const upNext = resolveUpNextBlocks(enriched, hero, 1);
    expect(upNext.map(b => b.id)).toEqual(['play']);
    const later = resolveLaterBlocks(
      enriched,
      hero,
      new Set(upNext.map(b => b.id)),
    );
    expect(later).toEqual([]);
  });

  it('scopes later list after up next for multiple pets blocks', () => {
    const now = new Date(2026, 8, 17, 6, 0, 0);
    const enriched = enrichWellnessBlocks({
      blocks: [
        block({ id: 'a', scheduledTime: '09:00', petId: 'bruno' }),
        block({ id: 'b', scheduledTime: '10:00', petId: 'bruno' }),
        block({ id: 'c', scheduledTime: '11:00', petId: 'bruno' }),
        block({ id: 'd', scheduledTime: '12:00', petId: 'bruno' }),
      ],
      species: 'dog',
      now,
      relaxedMode: true,
    });
    const hero = resolveHeroBlockId(enriched);
    const upNext = resolveUpNextBlocks(enriched, hero, 1);
    const later = resolveLaterBlocks(
      enriched,
      hero,
      new Set(upNext.map(b => b.id)),
    );
    expect(hero).toBe('a');
    expect(upNext.map(b => b.id)).toEqual(['b']);
    expect(later.map(b => b.id)).toEqual(['c', 'd']);
  });
});
