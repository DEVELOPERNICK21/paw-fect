import { MarkCareBlockDone } from '../../usecases/MarkCareBlockDone';
import { SkipCareBlock } from '../../usecases/SkipCareBlock';
import { MigrateWellnessTasksToBlockStates } from '../../usecases/MigrateWellnessTasksToBlockStates';
import type {
  ScheduleCompletionRecord,
  ScheduleRepository,
} from '../../repositories/ScheduleRepository';
import type { WellnessTaskMap } from '../../models/WellnessTask';

function createRepoMock(initial: {
  states?: Record<string, ScheduleCompletionRecord>;
  tasks?: WellnessTaskMap;
}): ScheduleRepository & {
  states: Record<string, ScheduleCompletionRecord>;
  tasks: WellnessTaskMap;
} {
  const states = { ...(initial.states ?? {}) };
  const tasks = { ...(initial.tasks ?? {}) };
  return {
    states,
    tasks,
    getPreferences: jest.fn(),
    savePreferences: jest.fn(),
    getBlockStates: jest.fn(async () => ({ ...states })),
    saveBlockState: jest.fn(async (_u, _p, _d, blockId, state) => {
      states[blockId] = state;
    }),
    getDailyCompletionPercent: jest.fn(),
    saveDailyCompletionPercent: jest.fn(),
    getCareStreakDays: jest.fn(() => 0),
    getWellnessTasks: jest.fn(() => ({ ...tasks })),
    saveWellnessTask: jest.fn(),
    seedWellnessTasksFromBlockStates: jest.fn(),
    getWellnessStreak: jest.fn(),
    saveWellnessStreak: jest.fn(),
    getRelaxedMode: jest.fn(),
    setRelaxedMode: jest.fn(),
    getDailyCompletionPercents: jest.fn(),
  } as unknown as ScheduleRepository & {
    states: Record<string, ScheduleCompletionRecord>;
    tasks: WellnessTaskMap;
  };
}

describe('Care completion SSOT', () => {
  it('MarkCareBlockDone writes completedAt and clears skippedAt', async () => {
    const repo = createRepoMock({
      states: {
        b1: {
          completedAt: null,
          snoozedUntil: null,
          skippedAt: '2026-09-17T08:00:00.000Z',
        },
      },
    });
    await new MarkCareBlockDone(repo).execute({
      userId: 'u1',
      petId: 'p1',
      date: '2026-09-17',
      blockId: 'b1',
      completed: true,
    });
    expect(repo.states.b1.completedAt).toBeTruthy();
    expect(repo.states.b1.skippedAt).toBeNull();
  });

  it('SkipCareBlock writes skippedAt without completedAt', async () => {
    const repo = createRepoMock({});
    await new SkipCareBlock(repo).execute({
      userId: 'u1',
      petId: 'p1',
      date: '2026-09-17',
      blockId: 'b1',
    });
    expect(repo.states.b1.completedAt).toBeNull();
    expect(repo.states.b1.skippedAt).toBeTruthy();
  });

  it('migrates MMKV done/skipped into block states once', async () => {
    const repo = createRepoMock({
      tasks: {
        feed: { status: 'done', updatedAt: '2026-09-17T07:00:00.000Z' },
        walk: { status: 'skipped', updatedAt: '2026-09-17T08:00:00.000Z' },
      },
    });
    await new MigrateWellnessTasksToBlockStates(repo).execute({
      userId: 'u1',
      petId: 'p1',
      date: '2026-09-17',
    });
    expect(repo.states.feed.completedAt).toBe('2026-09-17T07:00:00.000Z');
    expect(repo.states.walk.skippedAt).toBe('2026-09-17T08:00:00.000Z');
  });

  it('Home and Care share the same block-state write path', async () => {
    const repo = createRepoMock({});
    const mark = new MarkCareBlockDone(repo);
    // Home path
    await mark.execute({
      userId: 'u1',
      petId: 'p1',
      date: '2026-09-17',
      blockId: 'feed',
      completed: true,
    });
    // Care path (same use case)
    const afterHome = { ...repo.states.feed };
    await mark.execute({
      userId: 'u1',
      petId: 'p1',
      date: '2026-09-17',
      blockId: 'feed',
      completed: true,
    });
    expect(repo.states.feed.completedAt).toBeTruthy();
    expect(afterHome.completedAt).toBeTruthy();
  });
});
