import { applyMustFireNotificationPlan } from './applyMustFireNotificationPlan';
import { getNotificationFeaturePorts } from './notificationFeaturePorts';
import {
  ensureNotificationsReady,
  type EnsureNotificationsReadyOptions,
} from './notificationDiagnostics';

/**
 * Rebuilds local notifications from persisted auth/pets/reminders without Zustand stores.
 * Used after device boot before stores hydrate.
 */
export async function resyncLocalNotificationsFromStorage(
  options?: EnsureNotificationsReadyOptions,
): Promise<boolean> {
  const granted = await ensureNotificationsReady(options);
  if (!granted) {
    return false;
  }

  const payload =
    await getNotificationFeaturePorts().loadMustFirePlanFromStorage();
  if (payload == null) {
    return false;
  }

  await applyMustFireNotificationPlan(payload);
  return true;
}
