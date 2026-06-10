import { getAppSessionUserId } from '../../shared/session/appSessionPorts';
import { recordsComposition } from '../../modules/records/recordsComposition';
import { usePetStore } from '../../modules/pets/store/petStore';
import {
  computeSmartHealthNotificationCoverage,
  type SmartHealthNotificationCoverage,
} from './smartHealthNotificationSelection';

export async function loadSmartHealthNotificationCoverage(): Promise<SmartHealthNotificationCoverage | null> {
  const userId = getAppSessionUserId();
  const pets = usePetStore.getState().pets;
  if (userId == null || pets.length === 0) {
    return null;
  }

  const records = (
    await Promise.all(
      pets.map(pet =>
        recordsComposition.getSmartHealthRecords.execute(userId, pet.id),
      ),
    )
  ).flat();

  return computeSmartHealthNotificationCoverage(records);
}

export function formatSmartHealthNotificationCoverage(
  coverage: SmartHealthNotificationCoverage,
): string {
  if (coverage.totalSchedulable === 0) {
    return 'No upcoming health doses need reminders right now.';
  }
  const base = `${coverage.scheduledCount} of ${coverage.totalSchedulable} upcoming doses have reminders scheduled.`;
  if (!coverage.capped) {
    return base;
  }
  return `${base} Some doses are not covered because of the multi-pet reminder limit.`;
}
