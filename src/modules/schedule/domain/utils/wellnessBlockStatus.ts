import type { DailyCareBlock, WellnessBlockStatus } from '../models/DailyCareBlock';
import type { PersistedWellnessTask } from '../models/WellnessTask';

function parseTimeToMinutes(time24: string): number {
  const [hours, minutes] = time24.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function nowMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Returns true when the current time is within ±windowMinutes of the scheduled time.
 */
export function isWithinActiveWindow(
  scheduledTime: string,
  now: Date,
  windowMinutes = 15,
): boolean {
  const scheduled = parseTimeToMinutes(scheduledTime);
  const current = nowMinutes(now);
  return Math.abs(current - scheduled) <= windowMinutes;
}

/**
 * Returns true when a block's time window has passed without completion.
 */
export function isBlockMissed(
  block: DailyCareBlock,
  now: Date,
  relaxedMode: boolean,
): boolean {
  if (relaxedMode) {
    return false;
  }
  if (block.status === 'done' || block.status === 'skipped') {
    return false;
  }
  const endMinutes =
    parseTimeToMinutes(block.scheduledTime) + block.durationMinutes + 15;
  return nowMinutes(now) > endMinutes;
}

/**
 * Derives runtime status from completion SSOT on the block (and optional
 * legacy MMKV task overlay during migration).
 */
export function deriveBlockStatus(
  block: DailyCareBlock,
  persisted: PersistedWellnessTask | undefined,
  now: Date,
): WellnessBlockStatus {
  if (block.isCompleted || persisted?.status === 'done') {
    return 'done';
  }
  if (block.isSkipped || persisted?.status === 'skipped') {
    return 'skipped';
  }
  if (isWithinActiveWindow(block.scheduledTime, now)) {
    return 'active';
  }
  return 'upcoming';
}
