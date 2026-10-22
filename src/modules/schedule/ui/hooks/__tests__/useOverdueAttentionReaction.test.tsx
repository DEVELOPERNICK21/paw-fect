import React from 'react';
import { act, create } from 'react-test-renderer';

import type { MascotReactionRequest } from '../../../../../shared/components/Mascot';
import type { CareAggregatedItem } from '../../../domain/utils/careAggregator';
import { useOverdueAttentionReaction } from '../useOverdueAttentionReaction';

const item = (blockId: string, urgency: CareAggregatedItem['urgency'], petId = 'p1') =>
  ({ urgency, pet: { id: petId }, block: { id: blockId } }) as unknown as CareAggregatedItem;

let latest: MascotReactionRequest | null = null;
const Host: React.FC<{ items: CareAggregatedItem[] }> = ({ items }) => {
  latest = useOverdueAttentionReaction(items);
  return null;
};

beforeEach(() => {
  latest = null;
  jest.useFakeTimers({ now: new Date(2026, 9, 22, 10, 0, 0) });
});
afterEach(() => jest.useRealTimers());

describe('useOverdueAttentionReaction', () => {
  it('asks for nothing when nothing is overdue', () => {
    act(() => {
      create(<Host items={[item('a', 'upcoming'), item('b', 'done')]} />);
    });
    expect(latest).toBeNull();
  });

  it('asks for attention when the screen first shows an overdue task', () => {
    act(() => {
      create(<Host items={[item('a', 'overdue')]} />);
    });
    expect(latest?.reaction).toBe('attention');
  });

  it('does not ask again for the same overdue task on re-render or a new array', () => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<Host items={[item('a', 'overdue')]} />);
    });
    const first = latest;
    act(() => tree.update(<Host items={[item('a', 'overdue')]} />));
    act(() => tree.update(<Host items={[item('a', 'overdue'), item('z', 'upcoming')]} />));
    expect(latest).toBe(first);
  });

  it('asks again, with a new id, when another task becomes overdue', () => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<Host items={[item('a', 'overdue')]} />);
    });
    const first = latest?.id;
    act(() => tree.update(<Host items={[item('a', 'overdue'), item('b', 'overdue')]} />));
    expect(latest?.reaction).toBe('attention');
    expect(latest?.id).not.toBe(first);
  });

  it('stays quiet when an overdue task is completed', () => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<Host items={[item('a', 'overdue'), item('b', 'overdue')]} />);
    });
    const first = latest;
    act(() => tree.update(<Host items={[item('b', 'overdue'), item('a', 'done')]} />));
    expect(latest).toBe(first);
  });

  it('asks again the next day for a task that is still overdue', () => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<Host items={[item('a', 'overdue')]} />);
    });
    const first = latest?.id;
    jest.setSystemTime(new Date(2026, 9, 23, 10, 0, 0));
    act(() => tree.update(<Host items={[item('a', 'overdue')]} />));
    expect(latest?.id).not.toBe(first);
  });
});
