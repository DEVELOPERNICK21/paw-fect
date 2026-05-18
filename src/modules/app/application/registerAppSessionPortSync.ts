import { useAuthStore } from '../../auth/store/authStore';
import { useSubscriptionStore } from '../../subscription/store/subscriptionStore';
import { replaceAppSessionSnapshot } from '../../../shared/session/appSessionPorts';

function syncSessionPortsFromStores(): void {
  replaceAppSessionSnapshot({
    getUserId: () => useAuthStore.getState().user?.id ?? null,
    getMaxPets: () => useSubscriptionStore.getState().entitlement.maxPets,
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
}

ensureSessionPortSync();
