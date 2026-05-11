import type { SmartHealthRecord } from '../models/SmartHealthRecord';

export type MilestoneShareKind =
  | 'series_complete'
  | 'rabies_booster'
  | 'first_ever';

export interface MilestoneShareResult {
  kind: MilestoneShareKind;
}

/**
 * Whether marking `completed` should prompt the user to share a celebration
 * card (final puppy/kitten series dose, rabies, or first-ever completion).
 */
export function isMilestoneCompletion(
  completed: SmartHealthRecord,
  allForPet: SmartHealthRecord[],
): MilestoneShareResult | null {
  if (completed.status !== 'completed') {
    return null;
  }

  const completedForPet = allForPet.filter(r => r.status === 'completed');

  if (
    typeof completed.doseNumber === 'number' &&
    typeof completed.totalDoses === 'number' &&
    completed.totalDoses > 1 &&
    completed.doseNumber === completed.totalDoses
  ) {
    return { kind: 'series_complete' };
  }

  if (completed.family?.toLowerCase() === 'rabies') {
    return { kind: 'rabies_booster' };
  }

  const isMidSeries =
    typeof completed.doseNumber === 'number' &&
    typeof completed.totalDoses === 'number' &&
    completed.totalDoses > 1 &&
    completed.doseNumber < completed.totalDoses;

  if (completedForPet.length === 1 && !isMidSeries) {
    return { kind: 'first_ever' };
  }

  return null;
}
