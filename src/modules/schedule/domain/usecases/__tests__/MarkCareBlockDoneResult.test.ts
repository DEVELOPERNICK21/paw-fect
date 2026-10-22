import { MarkCareBlockDone } from '../MarkCareBlockDone';
import type {
  ScheduleCompletionRecord,
  ScheduleRepository,
} from '../../repositories/ScheduleRepository';

function repoWith(
  states: Record<string, ScheduleCompletionRecord>,
  save: jest.Mock = jest.fn(async () => undefined),
): ScheduleRepository {
  return {
    getBlockStates: jest.fn(async () => ({ ...states })),
    saveBlockState: save,
  } as unknown as ScheduleRepository;
}

const input = { userId: 'u1', petId: 'p1', date: '2026-10-22', blockId: 'b1' };
const open: ScheduleCompletionRecord = { completedAt: null, snoozedUntil: null, skippedAt: null };
const done: ScheduleCompletionRecord = { completedAt: '2026-10-22T08:00:00.000Z', snoozedUntil: null, skippedAt: null };

describe('MarkCareBlockDone result', () => {
  it('reports a change when an open block becomes completed', async () => {
    const result = await new MarkCareBlockDone(repoWith({ b1: open })).execute({ ...input, completed: true });
    expect(result).toEqual({ completionChanged: true });
  });

  it('reports a change for a block that has no saved state yet', async () => {
    const result = await new MarkCareBlockDone(repoWith({})).execute({ ...input, completed: true });
    expect(result.completionChanged).toBe(true);
  });

  it('reports no change when the block was already completed', async () => {
    const result = await new MarkCareBlockDone(repoWith({ b1: done })).execute({ ...input, completed: true });
    expect(result.completionChanged).toBe(false);
  });

  it('reports no change when un-completing', async () => {
    const result = await new MarkCareBlockDone(repoWith({ b1: done })).execute({ ...input, completed: false });
    expect(result.completionChanged).toBe(false);
  });

  it('does not resolve (so nothing can be announced) when saving fails', async () => {
    const save = jest.fn(async () => {
      throw new Error('disk full');
    });
    await expect(
      new MarkCareBlockDone(repoWith({ b1: open }, save)).execute({ ...input, completed: true }),
    ).rejects.toThrow('disk full');
  });
});
