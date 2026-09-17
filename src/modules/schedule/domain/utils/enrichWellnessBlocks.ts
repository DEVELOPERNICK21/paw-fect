import type { WellnessTaskMap } from '../models/WellnessTask';
import type { DailyCareBlock } from '../models/DailyCareBlock';
import { deriveBlockStatus, isBlockMissed } from './wellnessBlockStatus';
import { resolveInsightTip } from './wellnessInsightTips';

type PetSpecies = 'dog' | 'cat';

export interface EnrichWellnessBlocksInput {
  blocks: DailyCareBlock[];
  species: PetSpecies;
  /** @deprecated Prefer block.isCompleted / isSkipped from BuildDailySchedule. */
  taskMap?: WellnessTaskMap;
  now: Date;
  relaxedMode: boolean;
}

/**
 * Enriches engine-generated blocks with wellness UI fields (status, tips, missed flag).
 * Completion comes from DailyCareBlock SSOT; taskMap is legacy fallback only.
 */
export function enrichWellnessBlocks(
  input: EnrichWellnessBlocksInput,
): DailyCareBlock[] {
  const taskMap = input.taskMap ?? {};
  return input.blocks.map(block => {
    const persisted = taskMap[block.id];
    const status = deriveBlockStatus(block, persisted, input.now);
    const isProFeature = !block.isFreeFeature;
    const isCompleted = status === 'done';
    const isSkipped = status === 'skipped';
    return {
      ...block,
      status,
      isProFeature,
      isCompleted,
      isSkipped,
      completedAt:
        status === 'done'
          ? block.completedAt ?? persisted?.updatedAt ?? new Date().toISOString()
          : block.completedAt,
      insightTip: resolveInsightTip(block, input.species, input.now),
      isMissed: isBlockMissed(
        { ...block, status },
        input.now,
        input.relaxedMode,
      ),
    };
  });
}

/**
 * Returns the hero block: active within window, else soonest upcoming non-done block.
 */
export function resolveHeroBlockId(blocks: DailyCareBlock[]): string | null {
  const active = blocks.find(block => block.status === 'active');
  if (active) {
    return active.id;
  }
  const sortByTime = (left: DailyCareBlock, right: DailyCareBlock): number =>
    left.scheduledTime.localeCompare(right.scheduledTime) || left.order - right.order;
  const upcoming = blocks
    .filter(block => block.status === 'upcoming')
    .sort(sortByTime);
  if (upcoming[0]) {
    return upcoming[0].id;
  }
  const remaining = blocks
    .filter(block => block.status !== 'done' && block.status !== 'skipped')
    .sort(sortByTime);
  return remaining[0]?.id ?? null;
}

/**
 * Returns the next upcoming block after the hero (Up Next — single item).
 */
export function resolveUpNextBlocks(
  blocks: DailyCareBlock[],
  heroBlockId: string | null,
  limit = 1,
): DailyCareBlock[] {
  return blocks
    .filter(
      block =>
        block.status === 'upcoming' &&
        block.id !== heroBlockId,
    )
    .sort(
      (left, right) =>
        left.scheduledTime.localeCompare(right.scheduledTime) ||
        left.order - right.order,
    )
    .slice(0, limit);
}

/**
 * Remaining incomplete blocks after hero + up-next (Later list).
 */
export function resolveLaterBlocks(
  blocks: DailyCareBlock[],
  heroBlockId: string | null,
  upNextIds: Set<string>,
): DailyCareBlock[] {
  return blocks
    .filter(
      block =>
        block.status === 'upcoming' &&
        block.id !== heroBlockId &&
        !upNextIds.has(block.id),
    )
    .sort(
      (left, right) =>
        left.scheduledTime.localeCompare(right.scheduledTime) ||
        left.order - right.order,
    );
}
