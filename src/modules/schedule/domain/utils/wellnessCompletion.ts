import type { DailyCareBlock } from '../models/DailyCareBlock';

export interface DayCompletion {
  done: number;
  total: number;
  percentage: number;
}

/**
 * Returns blocks that count toward daily completion (Pro blocks excluded for free users).
 */
export function getCountableBlocks(
  blocks: DailyCareBlock[],
  isPro: boolean,
): DailyCareBlock[] {
  if (isPro) {
    return blocks;
  }
  return blocks.filter(block => block.isFreeFeature);
}

/**
 * Computes done/total/percentage for countable blocks using wellness status.
 */
export function getDayCompletion(
  blocks: DailyCareBlock[],
  isPro: boolean,
): DayCompletion {
  const countable = getCountableBlocks(blocks, isPro);
  if (countable.length === 0) {
    return { done: 0, total: 0, percentage: 0 };
  }
  const done = countable.filter(
    block => block.status === 'done' || block.isCompleted,
  ).length;
  const total = countable.length;
  const percentage = Math.round((done / total) * 100);
  return { done, total, percentage };
}

/**
 * Returns true when all countable tasks for the day are complete.
 */
export function isDayFullyComplete(completion: DayCompletion): boolean {
  return completion.total > 0 && completion.percentage >= 100;
}
