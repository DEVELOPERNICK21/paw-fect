import { InteractionManager } from 'react-native';

import { startupError, startupLog } from '../logging/startupLog';

import { resyncAllLocalNotifications } from './resyncLocalNotifications';

let resyncTimer: ReturnType<typeof setTimeout> | null = null;
let resyncInFlight: Promise<void> | null = null;

/**
 * Schedules a single notification resync after UI interactions settle.
 * Coalesces duplicate calls from auth sync and AppState resume.
 */
export function scheduleDeferredNotificationResync(delayMs = 1500): void {
  if (resyncTimer != null) {
    clearTimeout(resyncTimer);
  }
  resyncTimer = setTimeout(() => {
    resyncTimer = null;
    InteractionManager.runAfterInteractions(() => {
      try {
        if (resyncInFlight != null) {
          startupLog('notifications.resync.skipped', 'already_in_flight');
          return;
        }
        startupLog('notifications.resync.begin');
        resyncInFlight = resyncAllLocalNotifications()
          .then(() => startupLog('notifications.resync.done'))
          .catch(error => startupError('notifications.resync', error))
          .finally(() => {
            resyncInFlight = null;
          });
      } catch (error) {
        startupError('notifications.resync.schedule', error);
        /* runAfterInteractions/sync must not tear down the RN shell */
      }
    });
  }, delayMs);
}

export function cancelDeferredNotificationResync(): void {
  if (resyncTimer != null) {
    clearTimeout(resyncTimer);
    resyncTimer = null;
  }
}
