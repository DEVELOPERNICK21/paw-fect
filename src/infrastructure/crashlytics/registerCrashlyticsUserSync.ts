import { InteractionManager } from 'react-native';
import { getCrashlytics, setUserId } from '@react-native-firebase/crashlytics';

import {
  getAppSessionUserId,
  subscribeAppSession,
} from '../../shared/session/appSessionPorts';

let lastSyncedUserId: string | null | undefined;
let subscribed = false;

function syncCrashlyticsUserId(): void {
  try {
    const id = getAppSessionUserId();
    if (id === lastSyncedUserId) {
      return;
    }
    lastSyncedUserId = id;
    if (id == null) {
      return;
    }
    void setUserId(getCrashlytics(), id);
  } catch {
    /* Crashlytics must never tear down the RN shell */
  }
}

/**
 * Binds Crashlytics user id to session. Call once after the app shell mounts —
 * not at module load (native bridge may not be ready during import).
 */
export function registerCrashlyticsUserSync(): void {
  if (subscribed) {
    return;
  }
  subscribed = true;
  InteractionManager.runAfterInteractions(() => {
    syncCrashlyticsUserId();
    subscribeAppSession(syncCrashlyticsUserId);
  });
}
