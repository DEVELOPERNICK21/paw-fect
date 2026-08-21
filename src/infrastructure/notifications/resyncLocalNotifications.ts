import { applyMustFireNotificationPlan } from './applyMustFireNotificationPlan';
import { getNotificationFeaturePorts } from './notificationFeaturePorts';
import {
  ensureNotificationsReady,
  type EnsureNotificationsReadyOptions,
} from './notificationDiagnostics';

/**
 * Rebuilds every must-fire local notification pipeline (smart health, reminders, all pets' schedules).
 * Call after login, cold start, or when the user re-enables notifications.
 */
export async function resyncAllLocalNotifications(
  options?: EnsureNotificationsReadyOptions,
): Promise<void> {
  const granted = await ensureNotificationsReady(options);
  if (!granted) {
    return;
  }

  const payload =
    await getNotificationFeaturePorts().loadMustFirePlanFromSession();
  if (payload == null) {
    return;
  }

  await applyMustFireNotificationPlan(payload);
}
