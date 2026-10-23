import React from 'react';
import { AppState } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { EMPTY_MASCOT_MEMORY } from '../../../domain/mascot/mascotPresence';
import { useMascotMemoryStore } from '../../../store/mascotMemoryStore';
import { GREETING_SHOWN_MS, useHomeGreeting, type HomeGreetingInput, type HomeGreetingState } from '../useHomeGreeting';

const at = (y: number, m: number, d: number, h = 9): Date => new Date(y, m - 1, d, h, 0, 0);

let latest: HomeGreetingState | null = null;
/** Read through a function so TypeScript does not narrow the variable to `null` after a reset. */
const read = (): HomeGreetingState | null => latest;
let appStateHandler: ((state: string) => void) | null = null;

const Host: React.FC<HomeGreetingInput> = props => {
  latest = useHomeGreeting(props);
  return null;
};

const mounted: ReactTestRenderer[] = [];
function mount(props: Partial<HomeGreetingInput> & { getNow: () => Date }): ReactTestRenderer {
  const full: HomeGreetingInput = { enabled: true, hasPet: true, petName: 'Bruno', petDob: '2022-01-10', ...props };
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(<Host {...full} />);
  });
  mounted.push(tree);
  return tree;
}
const remember = (lastOpenedAt: Date, extra: Record<string, unknown> = {}): void => {
  useMascotMemoryStore.setState({
    lastOpenedAt: lastOpenedAt.toISOString(),
    lastGreetedYmd: '2000-01-01',
    lastBirthdayYear: null,
    ...extra,
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  latest = null;
  appStateHandler = null;
  useMascotMemoryStore.setState({ ...EMPTY_MASCOT_MEMORY });
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, cb: (s: string) => void) => {
    appStateHandler = cb;
    return { remove: jest.fn() };
  }) as unknown as typeof AppState.addEventListener);
});
afterEach(() => {
  act(() => {
    mounted.splice(0).forEach(t => t.unmount());
  });
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('useHomeGreeting', () => {
  it('says nothing on the very first Home visit, but remembers it', () => {
    const now = at(2026, 5, 2, 9);
    mount({ getNow: () => now });
    expect(read()?.request).toBeNull();
    expect(read()?.lines).toBeNull();
    expect(useMascotMemoryStore.getState().lastOpenedAt).toBe(now.toISOString());
  });

  it('greets once on a new day: a welcome reaction, time-of-day lines, Home keeps its own mood', () => {
    remember(at(2026, 5, 1, 20));
    mount({ getNow: () => at(2026, 5, 2, 8) });
    expect(read()?.request).toMatchObject({ reaction: 'welcome' });
    expect(String(read()?.request?.id)).toMatch(/^home-greeting-/);
    expect(read()?.lines?.[0]).toMatch(/Good morning/);
    expect(read()?.lines?.[0]).toContain('Bruno');
    expect(read()?.mood).toBeNull();
  });

  it('does not greet again when Home is opened a second time the same day', () => {
    remember(at(2026, 5, 1, 20));
    const first = mount({ getNow: () => at(2026, 5, 2, 8) });
    expect(read()?.request).not.toBeNull();
    act(() => first.unmount());
    latest = null;
    mount({ getNow: () => at(2026, 5, 2, 17) });
    expect(read()?.request).toBeNull();
  });

  it('welcomes you back after days away, waving', () => {
    remember(at(2026, 5, 1, 9));
    mount({ getNow: () => at(2026, 5, 7, 9) });
    expect(read()?.request).toMatchObject({ reaction: 'welcome' });
    expect(read()?.lines?.[0]).toMatch(/Welcome back/);
    expect(read()?.mood).toBe('wave');
  });

  it('celebrates the pet\'s birthday, with the age, celebrating', () => {
    remember(at(2026, 1, 9, 9));
    mount({ getNow: () => at(2026, 1, 10, 9), petDob: '2022-01-10' });
    expect(read()?.request).toMatchObject({ reaction: 'celebrate' });
    expect(read()?.lines?.[0]).toContain('Happy birthday, Bruno');
    expect(read()?.lines?.[0]).toContain('4 years old');
    expect(read()?.mood).toBe('celebrating');
  });

  it('does nothing, and remembers nothing, without a pet', () => {
    remember(at(2026, 5, 1, 9));
    const before = useMascotMemoryStore.getState().lastOpenedAt;
    mount({ getNow: () => at(2026, 5, 9, 9), hasPet: false });
    expect(read()?.request).toBeNull();
    expect(useMascotMemoryStore.getState().lastOpenedAt).toBe(before);
  });

  it('waits until Home is the visible tab, then greets', () => {
    remember(at(2026, 5, 1, 20));
    const props = { getNow: () => at(2026, 5, 2, 8) };
    const tree = mount({ ...props, enabled: false });
    expect(read()?.request).toBeNull();
    expect(useMascotMemoryStore.getState().lastGreetedYmd).toBe('2000-01-01');
    act(() => tree.update(<Host enabled hasPet petName="Bruno" petDob="2022-01-10" {...props} />));
    expect(read()?.request).toMatchObject({ reaction: 'welcome' });
  });

  it('gives each greeting its own id so it plays once, and stays gone after nine seconds', () => {
    expect(GREETING_SHOWN_MS).toBe(9000); // pinned as a plain number, the timings below are literal on purpose
    remember(at(2026, 5, 1, 20));
    mount({ getNow: () => at(2026, 5, 2, 8) });
    expect(read()?.request).not.toBeNull();
    act(() => {
      jest.advanceTimersByTime(8999);
    });
    expect(read()?.request).not.toBeNull();
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(read()?.request).toBeNull();
    expect(read()?.lines).toBeNull();
  });

  it('greets again when the app comes back to the foreground on a new day (left open overnight)', () => {
    let now = at(2026, 5, 2, 8);
    remember(at(2026, 5, 1, 20));
    mount({ getNow: () => now });
    const firstId = read()?.request?.id;
    expect(firstId).toBeDefined();
    act(() => {
      jest.advanceTimersByTime(9000);
    });
    expect(read()?.request).toBeNull();
    act(() => appStateHandler?.('background'));
    now = at(2026, 5, 3, 7);
    act(() => appStateHandler?.('active'));
    expect(read()?.request).toMatchObject({ reaction: 'welcome' });
    expect(read()?.request?.id).not.toBe(firstId);
  });

  it('does not greet again on a same-day return to the foreground', () => {
    let now = at(2026, 5, 2, 8);
    remember(at(2026, 5, 1, 20));
    mount({ getNow: () => now });
    act(() => {
      jest.advanceTimersByTime(9000);
    });
    act(() => appStateHandler?.('background'));
    now = at(2026, 5, 2, 15);
    act(() => appStateHandler?.('active'));
    expect(read()?.request).toBeNull();
  });

  it('does not decide anything before the saved memory has loaded (no greeting on every cold start)', () => {
    let finish: (() => void) | null = null;
    jest.spyOn(useMascotMemoryStore.persist, 'hasHydrated').mockReturnValue(false);
    jest.spyOn(useMascotMemoryStore.persist, 'onFinishHydration').mockImplementation(cb => {
      finish = () => cb(useMascotMemoryStore.getState());
      return () => undefined;
    });
    remember(at(2026, 5, 1, 20));
    mount({ getNow: () => at(2026, 5, 2, 8) });
    expect(read()?.request).toBeNull();
    expect(useMascotMemoryStore.getState().lastGreetedYmd).toBe('2000-01-01');
    jest.spyOn(useMascotMemoryStore.persist, 'hasHydrated').mockReturnValue(true);
    act(() => finish?.());
    expect(read()?.request).toMatchObject({ reaction: 'welcome' });
  });

  it('uses the pet name from the latest props', () => {
    remember(at(2026, 5, 1, 20));
    const props = { getNow: () => at(2026, 5, 2, 8) };
    const tree = mount({ ...props, petName: 'Bruno' });
    act(() => tree.update(<Host enabled hasPet petName="Luna" petDob="2022-01-10" {...props} />));
    expect(read()?.lines?.[0]).toContain('Luna');
  });
});
