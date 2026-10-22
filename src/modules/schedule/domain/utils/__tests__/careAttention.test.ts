import type { CareAggregatedItem } from '../careAggregator';
import {
  createOverdueAttentionTracker,
  mascotReactionForOverdue,
  overdueAttentionKeys,
} from '../careAttention';

const item = (petId: string, blockId: string, urgency: CareAggregatedItem['urgency']) =>
  ({ urgency, pet: { id: petId }, block: { id: blockId } }) as unknown as CareAggregatedItem;

describe('mascotReactionForOverdue', () => {
  it('is the calm attention reaction', () => {
    expect(mascotReactionForOverdue()).toBe('attention');
  });
});

describe('overdueAttentionKeys', () => {
  it('keeps only overdue tasks, identified by day, pet and task', () => {
    const keys = overdueAttentionKeys(
      [item('p1', 'feed', 'overdue'), item('p1', 'walk', 'now'), item('p2', 'meds', 'done'), item('p2', 'play', 'overdue')],
      '2026-10-22',
    );
    expect(keys).toEqual(['2026-10-22|p1|feed', '2026-10-22|p2|play']);
  });

  it('does not depend on the order of the items', () => {
    const a = overdueAttentionKeys([item('p1', 'a', 'overdue'), item('p1', 'b', 'overdue')], '2026-10-22');
    const b = overdueAttentionKeys([item('p1', 'b', 'overdue'), item('p1', 'a', 'overdue')], '2026-10-22');
    expect(a).toEqual(b);
  });

  it('is empty when nothing is overdue', () => {
    expect(overdueAttentionKeys([item('p1', 'a', 'upcoming')], '2026-10-22')).toEqual([]);
  });
});

describe('createOverdueAttentionTracker', () => {
  const d = '2026-10-22';

  it('announces the first time something is overdue', () => {
    const t = createOverdueAttentionTracker();
    expect(t.observe([`${d}|p1|feed`])).toBe(true);
  });

  it('does not announce nothing, and not the same overdue task twice', () => {
    const t = createOverdueAttentionTracker();
    expect(t.observe([])).toBe(false);
    expect(t.observe([`${d}|p1|feed`])).toBe(true);
    expect(t.observe([`${d}|p1|feed`])).toBe(false);
    expect(t.observe([`${d}|p1|feed`])).toBe(false);
  });

  it('announces when a different task becomes overdue', () => {
    const t = createOverdueAttentionTracker();
    t.observe([`${d}|p1|feed`]);
    expect(t.observe([`${d}|p1|feed`, `${d}|p1|walk`])).toBe(true);
    expect(t.observe([`${d}|p1|feed`, `${d}|p1|walk`])).toBe(false);
  });

  it('stays quiet when an overdue task is completed (fewer overdue)', () => {
    const t = createOverdueAttentionTracker();
    t.observe([`${d}|p1|feed`, `${d}|p1|walk`]);
    expect(t.observe([`${d}|p1|walk`])).toBe(false);
  });

  it('does not re-announce a task that went away and came back the same day', () => {
    const t = createOverdueAttentionTracker();
    t.observe([`${d}|p1|feed`]);
    t.observe([]);
    expect(t.observe([`${d}|p1|feed`])).toBe(false);
  });

  it('a new day starts fresh', () => {
    const t = createOverdueAttentionTracker();
    t.observe([`${d}|p1|feed`]);
    expect(t.observe(['2026-10-23|p1|feed'])).toBe(true);
  });

  it('reset forgets everything', () => {
    const t = createOverdueAttentionTracker();
    t.observe([`${d}|p1|feed`]);
    t.reset();
    expect(t.observe([`${d}|p1|feed`])).toBe(true);
  });
});
