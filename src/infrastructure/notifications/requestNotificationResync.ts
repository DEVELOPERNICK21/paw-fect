import type { EnsureNotificationsReadyOptions } from './notificationDiagnostics';

/**
 * Triggers a full must-fire notification resync without creating static import cycles
 * between resyncLocalNotifications and feature composition roots.
 */
export async function requestNotificationResync(
  options?: EnsureNotificationsReadyOptions,
): Promise<void> {
  // Lazy require breaks the static import cycle with resyncLocalNotifications.
  const { resyncAllLocalNotifications } =
    require('./resyncLocalNotifications') as typeof import('./resyncLocalNotifications');
  await resyncAllLocalNotifications(options);
}
