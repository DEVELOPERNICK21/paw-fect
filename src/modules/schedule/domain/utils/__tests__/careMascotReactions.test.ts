import type { CareCompletionEvent } from '../../models/CareCompletionEvent';
import {
  careEventMatchesPetFilter,
  careMascotMood,
  mascotReactionForCareEvent,
} from '../careMascotReactions';
import type { CareAggregatedItem } from '../careAggregator';

const base: CareCompletionEvent = {
  type: 'care-task-completed',
  petId: 'p1',
  blockId: 'b1',
  date: '2026-10-22',
  dayCompleted: false,
};

const item = (urgency: CareAggregatedItem['urgency']): CareAggregatedItem =>
  ({ urgency }) as unknown as CareAggregatedItem;

describe('mascotReactionForCareEvent', () => {
  it('a completed task is a success', () => {
    expect(mascotReactionForCareEvent(base)).toBe('success');
  });

  it('finishing the day celebrates instead of (not as well as) a success', () => {
    expect(mascotReactionForCareEvent({ ...base, dayCompleted: true })).toBe('celebrate');
  });
});

describe('careMascotMood', () => {
  it('overdue is a calm nudge, never a worse mood', () => {
    expect(careMascotMood({ allGood: false, attentionItem: item('overdue') })).toBe('nudge');
  });

  it('overdue wins even if something else is done', () => {
    expect(careMascotMood({ allGood: true, attentionItem: item('overdue') })).toBe('nudge');
  });

  it('everything done is proud', () => {
    expect(careMascotMood({ allGood: true, attentionItem: null })).toBe('proud');
  });

  it('otherwise happy', () => {
    expect(careMascotMood({ allGood: false, attentionItem: item('now') })).toBe('happy');
    expect(careMascotMood({ allGood: false, attentionItem: null })).toBe('happy');
  });
});

describe('careEventMatchesPetFilter', () => {
  it('"all" matches every pet', () => {
    expect(careEventMatchesPetFilter('p1', 'all')).toBe(true);
  });

  it('a single pet filter matches only that pet', () => {
    expect(careEventMatchesPetFilter('p1', 'p1')).toBe(true);
    expect(careEventMatchesPetFilter('p2', 'p1')).toBe(false);
  });
});
