import { useBuddyBondStore } from '../buddyBondStore';

const mockStore: Record<string, unknown> = {};
jest.mock('../../../../infrastructure/storage/mmkvStorage', () => ({
  mmkvGetJson: (k: string) => mockStore[k] ?? null,
  mmkvSetJson: (k: string, v: unknown) => {
    mockStore[k] = v;
  },
}));
jest.mock('../scheduleStore', () => ({
  subscribeToCareCompletions: jest.fn(() => () => undefined),
  useScheduleStore: { getState: () => ({ careStreakDays: 2 }) },
}));

const event = (blockId: string, dayCompleted = false) => ({
  type: 'care-task-completed' as const,
  petId: 'p1',
  blockId,
  date: '2026-10-22',
  dayCompleted,
});

beforeEach(() => {
  Object.keys(mockStore).forEach(k => delete mockStore[k]);
  useBuddyBondStore.setState({ xp: 0, awarded: [], pendingLevelUp: null, hydrated: false });
});

describe('buddyBondStore', () => {
  it('pays once per completed task, even if the event repeats', () => {
    const { awardCompletion } = useBuddyBondStore.getState();
    awardCompletion(event('a'), 2);
    awardCompletion(event('a'), 2);
    expect(useBuddyBondStore.getState().xp).toBe(10);
  });

  it('pays the day bonus with the streak when the day is done', () => {
    useBuddyBondStore.getState().awardCompletion(event('a', true), 2);
    expect(useBuddyBondStore.getState().xp).toBe(10 + 25 + 4);
  });

  it('flags a level-up once and lets the user dismiss it', () => {
    const { awardCompletion } = useBuddyBondStore.getState();
    for (const id of ['a', 'b', 'c', 'd', 'e']) {
      awardCompletion(event(id), 0);
    }
    expect(useBuddyBondStore.getState().xp).toBe(50);
    expect(useBuddyBondStore.getState().pendingLevelUp).toBe(2);
    useBuddyBondStore.getState().dismissLevelUp();
    expect(useBuddyBondStore.getState().pendingLevelUp).toBeNull();
  });

  it('survives a restart', () => {
    useBuddyBondStore.getState().awardCompletion(event('a'), 0);
    useBuddyBondStore.setState({ xp: 0, awarded: [], hydrated: false });
    useBuddyBondStore.getState().hydrate();
    expect(useBuddyBondStore.getState().xp).toBe(10);
    useBuddyBondStore.getState().awardCompletion(event('a'), 0);
    expect(useBuddyBondStore.getState().xp).toBe(10);
  });
});
