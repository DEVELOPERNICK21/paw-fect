import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import {
  SAVED_CHEER_VISIBLE_MS,
  useReminderSavedCheer,
  type ReminderSavedCheer,
} from '../useReminderSavedCheer';

type Params = { savedAt?: number; savedPetName?: string } | undefined;

let latest: ReminderSavedCheer | null = null;
let clock = 1_000_000;
const now = (): number => clock;

const Host: React.FC<{ params: Params }> = ({ params }) => {
  latest = useReminderSavedCheer(params, now);
  return null;
};

const mounted: ReactTestRenderer[] = [];
function mount(params: Params): (next: Params) => void {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(<Host params={params} />);
  });
  mounted.push(tree);
  return next => act(() => tree.update(<Host params={next} />));
}

beforeEach(() => {
  jest.useFakeTimers();
  clock = 1_000_000;
  latest = null;
});

afterEach(() => {
  act(() => {
    mounted.splice(0).forEach(t => t.unmount());
  });
  jest.useRealTimers();
});

describe('useReminderSavedCheer', () => {
  it('does nothing without a save', () => {
    mount(undefined);
    expect(latest).toBeNull();
  });

  it('cheers (success) for a fresh save, with the pet name, then goes away', () => {
    mount({ savedAt: clock, savedPetName: 'Milo' });
    expect(latest).toEqual({
      petName: 'Milo',
      request: { reaction: 'success', id: `reminder-saved-${clock}` },
    });
    act(() => {
      jest.advanceTimersByTime(SAVED_CHEER_VISIBLE_MS);
    });
    expect(latest).toBeNull();
  });

  it('ignores a stale save (e.g. restored navigation state)', () => {
    mount({ savedAt: clock - SAVED_CHEER_VISIBLE_MS - 1 });
    expect(latest).toBeNull();
  });

  it('each new save gets its own reaction id', () => {
    const update = mount({ savedAt: clock });
    const first = latest?.request.id;
    clock += 1000;
    update({ savedAt: clock });
    expect(latest?.request.id).not.toBe(first);
  });
});
