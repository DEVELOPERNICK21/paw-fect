import { InteractionManager } from 'react-native';

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
          return;
        }
        resyncInFlight = resyncAllLocalNotifications()
          .catch(() => {})
          .finally(() => {
            resyncInFlight = null;
          });
      } catch {
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
