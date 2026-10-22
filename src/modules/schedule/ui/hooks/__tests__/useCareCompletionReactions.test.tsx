import React, { type RefObject } from 'react';
import { act, create } from 'react-test-renderer';

import type { MascotHandle } from '../../../../../shared/components/Mascot';
import type { CareCompletionEvent } from '../../../domain/models/CareCompletionEvent';
import { useCareCompletionReactions } from '../useCareCompletionReactions';

type Listener = (event: CareCompletionEvent) => void;
const mockListeners = new Set<Listener>();

jest.mock('../../../store/scheduleStore', () => ({
  subscribeToCareCompletions: (listener: Listener) => {
    mockListeners.add(listener);
    return () => mockListeners.delete(listener);
  },
}));

const emit = (e: Partial<CareCompletionEvent> = {}): void => {
  const event: CareCompletionEvent = {
    type: 'care-task-completed',
    petId: 'p1',
    blockId: 'b1',
    date: '2026-10-22',
    dayCompleted: false,
    ...e,
  };
  mockListeners.forEach(l => l(event));
};

const Host: React.FC<{ handle: RefObject<MascotHandle | null>; petFilter: 'all' | string }> = ({ handle, petFilter }) => {
  useCareCompletionReactions(handle, petFilter);
  return null;
};

function setup(petFilter: 'all' | string = 'all') {
  const react = jest.fn(() => true);
  const handle: RefObject<MascotHandle | null> = { current: { react } };
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<Host handle={handle} petFilter={petFilter} />);
  });
  return { react, tree, handle };
}

beforeEach(() => mockListeners.clear());

describe('useCareCompletionReactions', () => {
  it('plays success for a completed task', () => {
    const { react } = setup();
    emit();
    expect(react).toHaveBeenCalledTimes(1);
    expect(react).toHaveBeenCalledWith('success');
  });

  it('plays celebrate (and not success) when the day was completed', () => {
    const { react } = setup();
    emit({ dayCompleted: true });
    expect(react).toHaveBeenCalledTimes(1);
    expect(react).toHaveBeenCalledWith('celebrate');
  });

  it('does nothing until an event arrives, and not on re-render', () => {
    const { react, tree, handle } = setup();
    act(() => tree.update(<Host handle={handle} petFilter="all" />));
    expect(react).not.toHaveBeenCalled();
  });

  it('ignores completions for pets the screen is not showing', () => {
    const { react } = setup('p2');
    emit({ petId: 'p1' });
    expect(react).not.toHaveBeenCalled();
    emit({ petId: 'p2' });
    expect(react).toHaveBeenCalledTimes(1);
  });

  it('follows a changed pet filter without resubscribing', () => {
    const { react, tree, handle } = setup('p2');
    act(() => tree.update(<Host handle={handle} petFilter="p1" />));
    expect(mockListeners.size).toBe(1);
    emit({ petId: 'p1' });
    expect(react).toHaveBeenCalledTimes(1);
  });

  it('is safe when the mascot is not mounted', () => {
    const handle: RefObject<MascotHandle | null> = { current: null };
    act(() => {
      create(<Host handle={handle} petFilter="all" />);
    });
    expect(() => emit()).not.toThrow();
  });

  it('unsubscribes on unmount', () => {
    const { react, tree } = setup();
    expect(mockListeners.size).toBe(1);
    act(() => tree.unmount());
    expect(mockListeners.size).toBe(0);
    emit();
    expect(react).not.toHaveBeenCalled();
  });
});
