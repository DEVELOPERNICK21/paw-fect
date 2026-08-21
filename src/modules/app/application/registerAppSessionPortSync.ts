import { useAuthStore } from '../../auth/store/authStore';
import { useSettingsStore } from '../../settings/store/settingsStore';
import { useSubscriptionStore } from '../../subscription/store/subscriptionStore';
import { replaceAppSessionSnapshot } from '../../../shared/session/appSessionPorts';

function syncSessionPortsFromStores(): void {
  replaceAppSessionSnapshot({
    getUserId: () => useAuthStore.getState().user?.id ?? null,
    getMaxPets: () => useSubscriptionStore.getState().entitlement.maxPets,
    getPlan: () => useSubscriptionStore.getState().entitlement.plan,
    getEntitlementSource: () => useSubscriptionStore.getState().entitlement.source,
    isEntitlementServerSynced: () =>
      useSubscriptionStore.getState().serverSynced,
    areNotificationsEnabled: () =>
      useSettingsStore.getState().settings?.notificationsEnabled ?? true,
  });
}

let subscribed = false;

function ensureSessionPortSync(): void {
  if (subscribed) {
    return;
  }
  subscribed = true;
  syncSessionPortsFromStores();
  useAuthStore.subscribe(syncSessionPortsFromStores);
  useSubscriptionStore.subscribe(syncSessionPortsFromStores);
  useSettingsStore.subscribe(syncSessionPortsFromStores);
}

ensureSessionPortSync();
