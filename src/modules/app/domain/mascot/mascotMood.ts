import type { MascotMood, MascotSpecies } from '../../../../shared/components/Mascot/mascotTypes';
import type { HomeDashboardViewModel } from '../models/HomeDashboardViewModel';
import { daysUntilDate } from '../utils/homeDashboardDates';

/** A milestone this close (in days) makes the mascot curious rather than relaxed. */
export const MASCOT_DUE_SOON_DAYS = 7;
const NIGHT_START_HOUR = 21;
const NIGHT_END_HOUR = 6;

/**
 * Maps the home dashboard to the mascot's mood. Priority is deliberate:
 * 1. overdue → a gentle nudge (never sad or scolding),
 * 2. something due within a week → curious,
 * 3. every task for today done → proud,
 * 4. late night with nothing pending → sleepy,
 * 5. otherwise → happy (wave when there is no pet yet).
 */
export function mascotMoodForHome(
  vm: HomeDashboardViewModel,
  now: Date = new Date(vm.now),
): MascotMood {
  if (!vm.hasAnyPet || vm.activePet == null) {
    return 'wave';
  }

  const hasOverdue =
    vm.attentionBanner.show ||
    vm.actionHealthItems.some(item => item.urgency === 'overdue');
  if (hasOverdue) {
    return 'nudge';
  }

  if (vm.nextMilestone != null) {
    const days = daysUntilDate(vm.nextMilestone.dueDateYmd, now);
    if (days >= 0 && days <= MASCOT_DUE_SOON_DAYS) {
      return 'curious';
    }
  }

  const todayDone =
    vm.todayCare.length > 0 && vm.todayCare.every(item => item.showCompletedCheck);
  if (todayDone) {
    return 'proud';
  }

  const hour = now.getHours();
  if (hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR) {
    return 'sleepy';
  }

  return 'happy';
}

/** Dogs and "both" get the dog; cats get the cat. */
export function mascotSpeciesFor(
  type: 'dog' | 'cat' | 'both' | string | null | undefined,
): MascotSpecies {
  return type === 'cat' ? 'cat' : 'dog';
}
