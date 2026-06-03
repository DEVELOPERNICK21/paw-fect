import { InteractionManager } from 'react-native';
import { getCrashlytics, setUserId } from '@react-native-firebase/crashlytics';

import { useAuthStore } from '../../modules/auth/store/authStore';

let lastSyncedUserId: string | null | undefined;
let subscribed = false;

function syncCrashlyticsUserId(): void {
  try {
    const id = useAuthStore.getState().user?.id ?? null;
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
 * Binds Crashlytics user id to auth state. Call once after the app shell mounts —
 * not at module load (native bridge may not be ready during import).
 */
export function registerCrashlyticsUserSync(): void {
  if (subscribed) {
    return;
  }
  subscribed = true;
  InteractionManager.runAfterInteractions(() => {
    syncCrashlyticsUserId();
    useAuthStore.subscribe(syncCrashlyticsUserId);
  });
}
