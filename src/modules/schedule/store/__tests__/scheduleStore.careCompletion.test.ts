import type { CareCompletionEvent } from '../../domain/models/CareCompletionEvent';
import type { DailyCareBlock } from '../../domain/models/DailyCareBlock';
import type { DailySchedule } from '../../domain/models/DailySchedule';

// ---- mocks: the store is real, everything it talks to is controlled -------------------
const mockExecute = jest.fn();
const mockGetStreak = jest.fn();
const mockSession = { userId: 'u1' as string | null };

jest.mock('../../../../shared/session/appSessionPorts', () => ({
  getAppSessionUserId: () => mockSession.userId,
  getAppSessionPlan: () => 'free',
}));

jest.mock('../../scheduleComposition', () => {
  const { CareCompletionEventHub } = jest.requireActual('../../application/CareCompletionEventHub');
  return {
    scheduleComposition: {
      careCompletionEvents: new CareCompletionEventHub(),
      markCareBlockDone: { execute: (...a: unknown[]) => mockExecute(...a) },
      getWellnessStreak: (...a: unknown[]) => mockGetStreak(...a),
      saveWellnessStreak: jest.fn(),
      cancelScheduleBlockNotification: jest.fn(async () => undefined),
    },
  };
});

import { scheduleComposition } from '../../scheduleComposition';
import { subscribeToCareCompletions, useScheduleStore } from '../scheduleStore';

const DATE = '2026-10-22';

const block = (id: string, isCompleted: boolean): DailyCareBlock =>
  ({
    id,
    petId: 'p1',
    isCompleted,
    isSkipped: false,
    isFreeFeature: true,
  }) as unknown as DailyCareBlock;

const scheduleOf = (...blocks: DailyCareBlock[]): DailySchedule =>
  ({ petId: 'p1', date: DATE, blocks }) as unknown as DailySchedule;

function seed(blocks: DailyCareBlock[]): void {
  const schedule = scheduleOf(...blocks);
  useScheduleStore.setState({
    schedule,
    careSchedulesByPetId: { p1: schedule },
    // reloading is not under test here
    loadCareDaySchedules: jest.fn(async () => undefined),
    loadDaySchedule: jest.fn(async () => undefined),
  });
}

const events: CareCompletionEvent[] = [];
let unsubscribe: () => void;

beforeEach(() => {
  jest.clearAllMocks();
  events.length = 0;
  mockSession.userId = 'u1';
  mockGetStreak.mockReturnValue({ count: 0, lastCompletedDate: null });
  mockExecute.mockResolvedValue({ completionChanged: true });
  unsubscribe = subscribeToCareCompletions(e => events.push(e));
});

afterEach(() => unsubscribe());

describe('scheduleStore.markCareBlockDone -> care completion events', () => {
  it('announces a task that was saved and newly completed', async () => {
    seed([block('b1', false), block('b2', false)]);
    await useScheduleStore.getState().markCareBlockDone('p1', 'b1', true);
    expect(events).toEqual([
      { type: 'care-task-completed', petId: 'p1', blockId: 'b1', date: DATE, dayCompleted: false },
    ]);
  });

  it('marks the event dayCompleted when it was the last open task', async () => {
    seed([block('b1', true), block('b2', false)]);
    await useScheduleStore.getState().markCareBlockDone('p1', 'b2', true);
    expect(events).toHaveLength(1);
    expect(events[0].dayCompleted).toBe(true);
  });

  it('does not celebrate the same day twice (streak already recorded for today)', async () => {
    mockGetStreak.mockReturnValue({ count: 3, lastCompletedDate: DATE });
    seed([block('b1', true), block('b2', false)]);
    await useScheduleStore.getState().markCareBlockDone('p1', 'b2', true);
    expect(events).toHaveLength(1);
    expect(events[0].dayCompleted).toBe(false);
  });

  it('stays silent when the block was already completed', async () => {
    mockExecute.mockResolvedValue({ completionChanged: false });
    seed([block('b1', true), block('b2', false)]);
    await useScheduleStore.getState().markCareBlockDone('p1', 'b1', true);
    expect(events).toHaveLength(0);
  });

  it('stays silent when a task is un-done', async () => {
    mockExecute.mockResolvedValue({ completionChanged: false });
    seed([block('b1', true)]);
    await useScheduleStore.getState().markCareBlockDone('p1', 'b1', false);
    expect(events).toHaveLength(0);
  });

  it('stays silent, and rethrows, when saving fails', async () => {
    mockExecute.mockRejectedValue(new Error('offline'));
    seed([block('b1', false)]);
    await expect(useScheduleStore.getState().markCareBlockDone('p1', 'b1', true)).rejects.toThrow('offline');
    expect(events).toHaveLength(0);
  });

  it('stays silent, and saves nothing, when nobody is signed in', async () => {
    mockSession.userId = null;
    seed([block('b1', false)]);
    await useScheduleStore.getState().markCareBlockDone('p1', 'b1', true);
    expect(mockExecute).not.toHaveBeenCalled();
    expect(events).toHaveLength(0);
  });

  it('announces after saving, never before', async () => {
    const order: string[] = [];
    mockExecute.mockImplementation(async () => {
      order.push('saved');
      return { completionChanged: true };
    });
    seed([block('b1', false)]);
    const off = scheduleComposition.careCompletionEvents.subscribe(() => order.push('announced'));
    await useScheduleStore.getState().markCareBlockDone('p1', 'b1', true);
    off();
    expect(order).toEqual(['saved', 'announced']);
  });
});
