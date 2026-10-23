import React from 'react';
import { AppState } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { RiveMascot } from '../RiveMascot';
import type { MascotHandle, MascotMood } from '../mascotTypes';

// A controllable stand-in for the native Rive runtime (same approach as RiveMascot.test.tsx).
const mockTriggers: Record<string, jest.Mock> = {};
const mockSetLookX = jest.fn();
const mockSetLookY = jest.fn();
const mockView = { play: jest.fn(async () => undefined), pause: jest.fn(async () => undefined), playIfNeeded: jest.fn() };
const mockInstance = { enumProperty: jest.fn(() => ({ set: jest.fn() })) };
const mockState = { instance: mockInstance as object | undefined };

jest.mock('@rive-app/react-native', () => ({
  Fit: { Contain: 'contain' },
  RiveView: () => null,
  useRive: () => ({ riveViewRef: mockView, setHybridRef: jest.fn() }),
  useRiveFile: () => ({ riveFile: {}, error: null }),
  useViewModelInstance: () => ({ instance: mockState.instance, error: null }),
  useRiveEnum: () => ({ setValue: jest.fn() }),
  useRiveNumber: (name: string) => ({ setValue: name === 'lookX' ? mockSetLookX : mockSetLookY }),
  useRiveTrigger: (name: string) => {
    if (!mockTriggers[name]) {
      mockTriggers[name] = jest.fn();
    }
    return { trigger: mockTriggers[name], error: null };
  },
}));

let appStateHandler: ((state: string) => void) | null = null;
const mounted: ReactTestRenderer[] = [];

interface Mounted {
  tree: ReactTestRenderer;
  handle: React.RefObject<MascotHandle | null>;
  rerender: (next?: Partial<React.ComponentProps<typeof RiveMascot>>) => void;
}

function mount(props: Partial<React.ComponentProps<typeof RiveMascot>> = {}): Mounted {
  const handle = React.createRef<MascotHandle>();
  const base = { source: 1 as number, mood: 'happy' as MascotMood, size: 100, interactive: true, onFailed: jest.fn() };
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(<RiveMascot ref={handle} {...base} {...props} />);
  });
  mounted.push(tree);
  return {
    tree,
    handle,
    rerender: next => {
      act(() => {
        tree.update(<RiveMascot ref={handle} {...base} {...props} {...next} />);
      });
    },
  };
}

const button = (tree: ReactTestRenderer): ReturnType<ReactTestRenderer['root']['findAll']>[number] =>
  tree.root.findAll(n => n.props.accessibilityRole === 'button' && typeof n.props.onPress === 'function')[0];
const touch = (location: { x: number; y: number }) => ({ nativeEvent: { locationX: location.x, locationY: location.y } });
const fired = (name: string): number => mockTriggers[name]?.mock.calls.length ?? 0;
const lastLook = (): [number | undefined, number | undefined] => [
  mockSetLookX.mock.calls[mockSetLookX.mock.calls.length - 1]?.[0],
  mockSetLookY.mock.calls[mockSetLookY.mock.calls.length - 1]?.[0],
];
const advance = (ms: number): void => {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  Object.values(mockTriggers).forEach(t => t.mockClear());
  mockState.instance = mockInstance;
  appStateHandler = null;
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, cb: (s: string) => void) => {
    appStateHandler = cb;
    return { remove: jest.fn() };
  }) as unknown as typeof AppState.addEventListener);
  // The idle plan is random; pin it to the fastest possible timeline.
  jest.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  act(() => {
    mounted.splice(0).forEach(t => t.unmount());
  });
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('eyes follow the finger', () => {
  it('looks where the finger lands, from the moment it touches down', () => {
    const { tree } = mount();
    act(() => button(tree).props.onTouchStart(touch({ x: 90, y: 10 })));
    const [x, y] = lastLook();
    expect(x).toBeCloseTo(0.8, 5);
    expect(y).toBeCloseTo(-0.8, 5);
  });

  it('follows a drag across the character', () => {
    const { tree } = mount();
    act(() => button(tree).props.onTouchStart(touch({ x: 10, y: 50 })));
    advance(50);
    act(() => button(tree).props.onTouchMove(touch({ x: 50, y: 50 })));
    advance(50);
    act(() => button(tree).props.onTouchMove(touch({ x: 95, y: 50 })));
    const xs = mockSetLookX.mock.calls.map(c => c[0] as number);
    expect(xs.length).toBe(3);
    expect(xs[0]).toBeLessThan(xs[1]);
    expect(xs[1]).toBeLessThan(xs[2]);
    expect(xs[2]).toBeCloseTo(0.9, 5);
  });

  it('is throttled: a flood of move events is followed about 30 times a second at most', () => {
    const { tree } = mount();
    act(() => button(tree).props.onTouchStart(touch({ x: 10, y: 50 })));
    for (let i = 0; i < 20; i += 1) {
      advance(5); // 200 events a second
      act(() => button(tree).props.onTouchMove(touch({ x: 10 + i, y: 50 })));
    }
    // 100 ms of events: the start plus at most one per 33 ms
    expect(mockSetLookX.mock.calls.length).toBeLessThanOrEqual(4);
    expect(mockSetLookX.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('keeps looking for a moment after the finger lifts, then glances back to the middle', () => {
    const { tree } = mount();
    act(() => button(tree).props.onTouchStart(touch({ x: 90, y: 50 })));
    advance(1300);
    expect(lastLook()[0]).not.toBe(0);
    advance(200);
    expect(lastLook()).toEqual([0, 0]);
  });

  it('a clamped finger far outside the box never pushes the eyes past the edge', () => {
    const { tree } = mount();
    act(() => button(tree).props.onTouchMove(touch({ x: 5000, y: -5000 })));
    expect(lastLook()).toEqual([1, -1]);
  });

  it('does nothing while paused or before the animation is loaded', () => {
    const { tree, rerender } = mount({ paused: true });
    act(() => button(tree).props.onTouchStart(touch({ x: 90, y: 50 })));
    expect(mockSetLookX).not.toHaveBeenCalled();
    rerender({ paused: false });
    mockState.instance = undefined;
    rerender({});
    act(() => button(tree).props.onTouchStart(touch({ x: 90, y: 50 })));
    expect(mockSetLookX).not.toHaveBeenCalled();
  });
});

describe('tap ladder', () => {
  const tap = (tree: ReactTestRenderer): void => {
    act(() => button(tree).props.onPress(touch({ x: 50, y: 50 })));
  };

  it('one tap is the heart, and onPress still fires', () => {
    const onPress = jest.fn();
    const { tree } = mount({ onPress });
    tap(tree);
    expect(fired('pet')).toBe(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('three quick taps reach the playful reaction, six reach the excited cheer', () => {
    const { tree } = mount();
    for (let i = 0; i < 6; i += 1) {
      tap(tree);
      advance(250);
    }
    expect(fired('pet')).toBe(1); // taps 1-2 are one heart; the gate does not restart it
    expect(fired('welcome')).toBe(1); // tap 3
    expect(fired('celebrate')).toBe(1); // tap 6
  });

  it('after the cheer, a fast burst only gives the heart again (no spamming the big animation)', () => {
    const { tree } = mount();
    for (let i = 0; i < 6; i += 1) {
      tap(tree);
      advance(250);
    }
    advance(3000); // reactions finished, cheer cooldown (6 s) still running
    for (let i = 0; i < 6; i += 1) {
      tap(tree);
      advance(250);
    }
    expect(fired('celebrate')).toBe(1);
  });

  it('a slow tapper just gets a heart each time', () => {
    const { tree } = mount();
    for (let i = 0; i < 3; i += 1) {
      tap(tree);
      advance(4000);
    }
    expect(fired('pet')).toBe(3);
    expect(fired('welcome')).toBe(0);
  });
});

describe('ref.look', () => {
  it('points the eyes, then glances back after the hold time', () => {
    const { handle } = mount();
    act(() => handle.current?.look(0.5, 0.4, 2000));
    expect(lastLook()).toEqual([0.5, 0.4]);
    advance(1999);
    expect(lastLook()).toEqual([0.5, 0.4]);
    advance(2);
    expect(lastLook()).toEqual([0, 0]);
  });

  it('holds 1.4 s by default, and a new look replaces the pending glance-back', () => {
    const { handle } = mount();
    act(() => handle.current?.look(-0.6, 0.2));
    advance(1000);
    act(() => handle.current?.look(0.6, 0.2));
    advance(1000); // 2 s after the first look: its reset must not have fired
    expect(lastLook()).toEqual([0.6, 0.2]);
    advance(500);
    expect(lastLook()).toEqual([0, 0]);
  });

  it('is a no-op while paused', () => {
    const { handle } = mount({ paused: true });
    act(() => handle.current?.look(0.5, 0.5));
    expect(mockSetLookX).not.toHaveBeenCalled();
  });

  it('keeps the react handle working', () => {
    const { handle } = mount();
    let started = false;
    act(() => {
      started = handle.current?.react('success') ?? false;
    });
    expect(started).toBe(true);
    expect(fired('success')).toBe(1);
  });
});

describe('idle life', () => {
  it('stays still for the first ten seconds, then glances', () => {
    mount();
    advance(9999);
    expect(mockSetLookX).not.toHaveBeenCalled();
    advance(1);
    expect(mockSetLookX).toHaveBeenCalledTimes(1);
    expect(lastLook()[0]).not.toBe(0);
  });

  it('follows its plan: three glances, then one curious "hm?" at about a minute, then quiet again', () => {
    mount();
    advance(59999);
    expect(fired('curious')).toBe(0);
    advance(1);
    expect(fired('curious')).toBe(1);
    advance(29000); // the next glance is 10 s later and the next "hm?" a minute after that
    expect(fired('curious')).toBe(1);
  });

  it('never more than one unprompted reaction in any minute', () => {
    mount();
    advance(60000 * 5);
    expect(fired('curious')).toBeLessThanOrEqual(5);
    expect(fired('curious')).toBeGreaterThanOrEqual(4);
  });

  it('a touch restarts the quiet period, so it never fidgets mid-interaction', () => {
    const { tree } = mount();
    advance(9000);
    act(() => button(tree).props.onTouchStart(touch({ x: 50, y: 50 })));
    const callsAfterTouch = mockSetLookX.mock.calls.length;
    advance(9000); // 18 s from mount, 9 s from the touch (the touch's own glance-back may run)
    const glancesNotFromTouch = mockSetLookX.mock.calls.slice(callsAfterTouch).filter(c => c[0] !== 0);
    expect(glancesNotFromTouch).toHaveLength(0);
    advance(1100);
    expect(mockSetLookX.mock.calls.slice(callsAfterTouch).some(c => c[0] !== 0)).toBe(true);
  });

  it.each(['sleepy', 'thinking', 'celebrating', 'nudge'] as const)('stays still in the %s mood', mood => {
    mount({ mood });
    advance(120000);
    expect(mockSetLookX).not.toHaveBeenCalled();
    expect(fired('curious')).toBe(0);
  });

  it.each(['happy', 'wave', 'curious', 'proud'] as const)('fidgets in the calm %s mood', mood => {
    mount({ mood });
    advance(10000);
    expect(mockSetLookX).toHaveBeenCalled();
  });

  it('stops when the mood becomes one that rests, and resumes in a calm one', () => {
    const { rerender } = mount({ mood: 'happy' });
    advance(10000);
    expect(mockSetLookX).toHaveBeenCalledTimes(1);
    rerender({ mood: 'sleepy' });
    mockSetLookX.mockClear();
    advance(120000);
    expect(mockSetLookX.mock.calls.filter(c => c[0] !== 0)).toHaveLength(0);
    rerender({ mood: 'happy' });
    advance(10000);
    expect(mockSetLookX.mock.calls.filter(c => c[0] !== 0).length).toBeGreaterThan(0);
  });

  it('is off for decorative (non-interactive) mascots unless asked for', () => {
    mount({ interactive: false });
    advance(120000);
    expect(mockSetLookX).not.toHaveBeenCalled();
    expect(fired('curious')).toBe(0);
  });

  it('can be switched on for a non-interactive mascot', () => {
    mount({ interactive: false, lively: true });
    advance(10000);
    expect(mockSetLookX).toHaveBeenCalled();
  });

  it('can be switched off for an interactive mascot', () => {
    mount({ interactive: true, lively: false });
    advance(120000);
    expect(mockSetLookX).not.toHaveBeenCalled();
    expect(fired('curious')).toBe(0);
  });

  it('does nothing while paused, in the background, or before it is loaded', () => {
    const paused = mount({ paused: true });
    advance(120000);
    expect(mockSetLookX).not.toHaveBeenCalled();
    act(() => paused.tree.unmount());

    const bg = mount();
    act(() => appStateHandler?.('background'));
    mockSetLookX.mockClear();
    advance(120000);
    expect(mockSetLookX).not.toHaveBeenCalled();
    act(() => bg.tree.unmount());

    mockState.instance = undefined;
    mount();
    advance(120000);
    expect(mockSetLookX).not.toHaveBeenCalled();
  });

  it('leaves no timers behind when unmounted', () => {
    const { tree } = mount();
    expect(jest.getTimerCount()).toBeGreaterThan(0);
    act(() => tree.unmount());
    expect(jest.getTimerCount()).toBe(0);
  });
});
