import React from 'react';
import { AppState } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { RiveMascot } from '../RiveMascot';
import { RIVE_PROPS } from '../mascotRiveSource';
import type { MascotHandle, MascotMood, MascotReaction } from '../mascotTypes';

// A controllable stand-in for the native Rive runtime. `mock*` names are allowed in the factory.
const mockTriggers: Record<string, jest.Mock> = {};
const mockSetMood = jest.fn();
const mockSetLookX = jest.fn();
const mockSetLookY = jest.fn();
const mockView = { play: jest.fn(async () => undefined), pause: jest.fn(async () => undefined), playIfNeeded: jest.fn() };
const mockInstance = { enumProperty: jest.fn(() => ({ set: jest.fn() })) };
const mockState = { fileError: null as Error | null, instance: mockInstance as object | undefined };
let mockRiveViewProps: Record<string, unknown> = {};

jest.mock('@rive-app/react-native', () => ({
  Fit: { Contain: 'contain' },
  RiveView: (props: Record<string, unknown>) => {
    mockRiveViewProps = props;
    return null;
  },
  useRive: () => ({ riveViewRef: mockView, setHybridRef: jest.fn() }),
  useRiveFile: () => ({
    riveFile: mockState.fileError ? undefined : {},
    error: mockState.fileError,
  }),
  useViewModelInstance: () => ({ instance: mockState.instance, error: null }),
  useRiveEnum: () => ({ setValue: mockSetMood }),
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
  onFailed: jest.Mock;
  rerender: (props?: Partial<React.ComponentProps<typeof RiveMascot>>) => void;
}

function mount(props: Partial<React.ComponentProps<typeof RiveMascot>> = {}): Mounted {
  const handle = React.createRef<MascotHandle>();
  const onFailed = jest.fn();
  const base = { source: 1 as number, mood: 'happy' as MascotMood, size: 100, interactive: false, onFailed };
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(<RiveMascot ref={handle} {...base} {...props} />);
  });
  mounted.push(tree);
  return {
    tree,
    handle,
    onFailed,
    rerender: next => {
      act(() => {
        tree.update(<RiveMascot ref={handle} {...base} {...props} {...next} />);
      });
    },
  };
}

const fired = (name: string): number => (mockTriggers[name]?.mock.calls.length ?? 0);

afterEach(() => {
  // unmount so the glance-reset timer is cleared
  act(() => {
    mounted.splice(0).forEach(t => t.unmount());
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  Object.values(mockTriggers).forEach(t => t.mockClear());
  mockState.fileError = null;
  mockState.instance = mockInstance;
  mockRiveViewProps = {};
  appStateHandler = null;
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, cb: (s: string) => void) => {
    appStateHandler = cb;
    return { remove: jest.fn() };
  }) as unknown as typeof AppState.addEventListener);
});

describe('RiveMascot', () => {
  it('writes the mood once and does not replay it on re-render', () => {
    const { rerender } = mount({ mood: 'happy' });
    expect(mockSetMood).toHaveBeenCalledTimes(1);
    expect(mockSetMood).toHaveBeenLastCalledWith('happy');
    rerender({});
    rerender({ size: 120 });
    rerender({ onPress: jest.fn() });
    expect(mockSetMood).toHaveBeenCalledTimes(1);
    rerender({ mood: 'sleepy' });
    expect(mockSetMood).toHaveBeenCalledTimes(2);
    expect(mockSetMood).toHaveBeenLastCalledWith('sleepy');
  });

  it('never fires a trigger just from rendering or re-rendering', () => {
    const { rerender } = mount();
    rerender({});
    for (const name of Object.keys(RIVE_PROPS)) {
      expect(fired(name)).toBe(0);
    }
  });

  it('fires the matching trigger for a reaction and reports that it started', () => {
    const { handle } = mount();
    let started = false;
    act(() => {
      started = handle.current?.react('success') ?? false;
    });
    expect(started).toBe(true);
    expect(fired('success')).toBe(1);
    expect(fired('celebrate')).toBe(0);
  });

  it('does not restart a reaction that is already playing', () => {
    const { handle } = mount();
    act(() => {
      handle.current?.react('success');
    });
    let again = true;
    act(() => {
      again = handle.current?.react('success') ?? true;
    });
    expect(again).toBe(false);
    expect(fired('success')).toBe(1);
  });

  it('lets celebrate take over from success', () => {
    const { handle } = mount();
    act(() => {
      handle.current?.react('success');
      handle.current?.react('celebrate');
    });
    expect(fired('success')).toBe(1);
    expect(fired('celebrate')).toBe(1);
  });

  it('a burst of taps plays pet once but still reports every tap', () => {
    const onPress = jest.fn();
    const { tree } = mount({ interactive: true, onPress, testID: 'm' });
    const press = (): void => {
      act(() => {
        const pressable = tree.root.findAll(
          n => n.props.accessibilityRole === 'button' && typeof n.props.onPress === 'function' && n.props.onPress !== onPress,
        )[0];
        pressable.props.onPress({ nativeEvent: { locationX: 80, locationY: 20 } });
      });
    };
    press();
    press();
    press();
    expect(fired('pet')).toBe(1);
    expect(onPress).toHaveBeenCalledTimes(3);
    // the character glanced toward the touch (80/100 -> +0.6, 20/100 -> -0.6)
    expect(mockSetLookX).toHaveBeenCalledWith(expect.closeTo(0.6, 5));
    expect(mockSetLookY).toHaveBeenCalledWith(expect.closeTo(-0.6, 5));
  });

  it('is not tappable unless interactive', () => {
    const { tree } = mount({ interactive: false, testID: 'm' });
    expect(tree.root.findAll(n => n.props.accessibilityRole === 'button')).toHaveLength(0);
  });

  it('ignores reactions and pauses frames while paused, then resumes', () => {
    const { handle, rerender } = mount({ paused: true });
    expect(mockView.pause).toHaveBeenCalled();
    expect(mockRiveViewProps.autoPlay).toBe(false);
    let started = true;
    act(() => {
      started = handle.current?.react('success') ?? true;
    });
    expect(started).toBe(false);
    expect(fired('success')).toBe(0);
    rerender({ paused: false });
    expect(mockView.play).toHaveBeenCalled();
    act(() => {
      started = handle.current?.react('success') ?? false;
    });
    expect(started).toBe(true);
  });

  it('pauses when the app goes to the background and resumes on return', () => {
    const { handle } = mount();
    expect(appStateHandler).not.toBeNull();
    mockView.pause.mockClear();
    act(() => appStateHandler?.('background'));
    expect(mockView.pause).toHaveBeenCalled();
    let started = true;
    act(() => {
      started = handle.current?.react('pet') ?? true;
    });
    expect(started).toBe(false);
    mockView.play.mockClear();
    act(() => appStateHandler?.('active'));
    expect(mockView.play).toHaveBeenCalled();
  });

  it('reports false while the file or view model is not ready', () => {
    mockState.instance = undefined;
    const { handle } = mount();
    let started = true;
    act(() => {
      started = handle.current?.react('success') ?? true;
    });
    expect(started).toBe(false);
    expect(fired('success')).toBe(0);
  });

  it('calls onFailed exactly once if the file cannot load', () => {
    mockState.fileError = new Error('bad file');
    const { onFailed, rerender } = mount();
    rerender({});
    expect(onFailed).toHaveBeenCalledTimes(1);
  });

  describe('reactionRequest', () => {
    let now = 1_000_000;
    beforeEach(() => {
      now = 1_000_000;
      jest.spyOn(Date, 'now').mockImplementation(() => now);
    });
    afterEach(() => {
      (Date.now as jest.Mock).mockRestore();
    });

    const request = (id: string | number, reaction: MascotReaction = 'welcome', ttlMs?: number) => ({
      reaction,
      id,
      ttlMs,
    });

    it('plays once as soon as the mascot is ready and visible', () => {
      mount({ reactionRequest: request('a') });
      expect(fired('welcome')).toBe(1);
    });

    it('waits for the view model to load, then plays', () => {
      mockState.instance = undefined;
      const { rerender } = mount({ reactionRequest: request('a') });
      expect(fired('welcome')).toBe(0);
      mockState.instance = mockInstance;
      rerender({});
      expect(fired('welcome')).toBe(1);
    });

    it('waits while paused (screen not focused), then plays on unpause', () => {
      const { rerender } = mount({ paused: true, reactionRequest: request('a', 'curious') });
      expect(fired('curious')).toBe(0);
      rerender({ paused: false });
      expect(fired('curious')).toBe(1);
    });

    it('never replays the same request on re-render, but plays a new id', () => {
      const { rerender } = mount({ reactionRequest: request('a', 'curious') });
      rerender({});
      rerender({ size: 90 });
      rerender({ reactionRequest: request('a', 'curious') });
      expect(fired('curious')).toBe(1);
      now += 5_000; // past the curious play time so the gate is free again
      rerender({ reactionRequest: request('b', 'curious') });
      expect(fired('curious')).toBe(2);
    });

    it('drops a request that waited longer than its ttl', () => {
      const { rerender } = mount({ paused: true, reactionRequest: request('a', 'curious', 3_000) });
      now += 3_001;
      rerender({ paused: false });
      expect(fired('curious')).toBe(0);
      // and it is not resurrected later
      rerender({});
      expect(fired('curious')).toBe(0);
    });

    it('uses a default ttl of 6 seconds', () => {
      const { rerender } = mount({ paused: true, reactionRequest: request('a', 'curious') });
      now += 5_900;
      rerender({ paused: false });
      expect(fired('curious')).toBe(1);

      const second = mount({ paused: true, reactionRequest: request('z', 'attention') });
      now += 6_100;
      second.rerender({ paused: false });
      expect(fired('attention')).toBe(0);
    });

    it('is dropped, not queued, when a higher-priority reaction is playing', () => {
      const { handle, rerender } = mount();
      act(() => {
        handle.current?.react('celebrate');
      });
      rerender({ reactionRequest: request('a', 'curious') });
      expect(fired('curious')).toBe(0);
      now += 10_000; // celebrate has finished
      rerender({});
      expect(fired('curious')).toBe(0);
    });

    it('does nothing for a null request', () => {
      mount({ reactionRequest: null });
      for (const name of Object.keys(RIVE_PROPS)) {
        expect(fired(name)).toBe(0);
      }
    });
  });
});
