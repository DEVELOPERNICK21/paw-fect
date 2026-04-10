import type { SmartHealthRecordStatus } from '../models/SmartHealthRecord';

export type DewormingUserTransition = 'complete' | 'skip';

/**
 * Valid user-driven transitions for a deworming schedule row.
 * OVERDUE is represented as status `overdue` (date-derived), not a separate stored enum.
 */
export function canApplyDewormingUserTransition(
  current: SmartHealthRecordStatus,
  transition: DewormingUserTransition,
): boolean {
  if (current === 'completed' || current === 'skipped') {
    return false;
  }
  if (transition === 'complete' || transition === 'skip') {
    return (
      current === 'upcoming' ||
      current === 'overdue' ||
      current === 'locked' ||
      current === 'missed'
    );
  }
  return false;
}

export function assertValidDewormingUserTransition(
  current: SmartHealthRecordStatus,
  transition: DewormingUserTransition,
): void {
  if (!canApplyDewormingUserTransition(current, transition)) {
    throw new Error(
      `[deworming-state] Invalid transition ${transition} from status ${current}`,
    );
  }
}
