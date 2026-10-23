import AsyncStorage from '@react-native-async-storage/async-storage';

import { EMPTY_MASCOT_MEMORY } from '../../domain/mascot/mascotPresence';
import { useMascotMemoryStore } from '../mascotMemoryStore';

const memoryOf = (): Record<string, unknown> => {
  const { lastOpenedAt, lastGreetedYmd, lastBirthdayYear } = useMascotMemoryStore.getState();
  return { lastOpenedAt, lastGreetedYmd, lastBirthdayYear };
};

beforeEach(() => {
  useMascotMemoryStore.getState().reset();
  jest.clearAllMocks();
});

describe('mascotMemoryStore', () => {
  it('starts empty', () => {
    expect(memoryOf()).toEqual(EMPTY_MASCOT_MEMORY);
  });

  it('remembers a visit and the hello that went with it', () => {
    const now = new Date(2026, 4, 2, 8, 0, 0);
    useMascotMemoryStore.getState().recordHomeVisit({ kind: 'daily', reaction: 'welcome' }, now);
    expect(memoryOf()).toEqual({
      lastOpenedAt: now.toISOString(),
      lastGreetedYmd: '2026-05-02',
      lastBirthdayYear: null,
    });
  });

  it('remembers a celebrated birthday', () => {
    const now = new Date(2026, 0, 10, 9, 0, 0);
    useMascotMemoryStore.getState().recordHomeVisit({ kind: 'birthday', reaction: 'celebrate', age: 3 }, now);
    expect(memoryOf().lastBirthdayYear).toBe(2026);
  });

  it('writes to storage under its own key, and only the memory fields', async () => {
    useMascotMemoryStore.getState().recordHomeVisit(null, new Date(2026, 4, 2, 8, 0, 0));
    await Promise.resolve();
    const calls = (AsyncStorage.setItem as jest.Mock).mock.calls.filter(c => c[0] === 'pawfect-mascot-memory');
    expect(calls.length).toBeGreaterThan(0);
    const stored = JSON.parse(calls[calls.length - 1][1]) as { state: Record<string, unknown>; version: number };
    expect(Object.keys(stored.state).sort()).toEqual(['lastBirthdayYear', 'lastGreetedYmd', 'lastOpenedAt']);
    expect(stored.version).toBe(1);
  });

  it('survives corrupt storage by starting empty', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ state: { lastOpenedAt: 12345, lastGreetedYmd: ['x'], lastBirthdayYear: 'nope' }, version: 1 }),
    );
    await useMascotMemoryStore.persist.rehydrate();
    expect(memoryOf()).toEqual(EMPTY_MASCOT_MEMORY);
  });

  it('restores a good saved memory', async () => {
    const saved = { lastOpenedAt: new Date(2026, 4, 1, 9).toISOString(), lastGreetedYmd: '2026-05-01', lastBirthdayYear: 2025 };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify({ state: saved, version: 1 }));
    await useMascotMemoryStore.persist.rehydrate();
    expect(memoryOf()).toEqual(saved);
  });

  it('reset forgets everything', () => {
    useMascotMemoryStore.getState().recordHomeVisit({ kind: 'daily', reaction: 'welcome' }, new Date());
    useMascotMemoryStore.getState().reset();
    expect(memoryOf()).toEqual(EMPTY_MASCOT_MEMORY);
  });
});
