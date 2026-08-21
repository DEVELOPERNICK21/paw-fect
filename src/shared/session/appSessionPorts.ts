/**
 * Session snapshot read by command stores without importing other feature stores.
 * Wired from auth + subscription + settings in `registerAppSessionPortSync`.
 */
import type { EntitlementSource } from '../subscription/entitlementEngine';
import { PLAN_FREE, type PlanKey } from '../subscription/planCatalog';
import { applyDevMaxPetsOverride } from './applyDevMaxPetsOverride';

export type AppSessionValues = {
  userId: string | null;
  maxPets: number;
  plan: PlanKey;
  entitlementSource: EntitlementSource;
  entitlementServerSynced: boolean;
  notificationsEnabled: boolean;
};

export type AppSessionSnapshot = {
  getUserId: () => string | null;
  getMaxPets: () => number;
  getPlan: () => PlanKey;
  getEntitlementSource: () => EntitlementSource;
  isEntitlementServerSynced: () => boolean;
  areNotificationsEnabled: () => boolean;
};

const defaultSnapshot: AppSessionSnapshot = {
  getUserId: () => null,
  /** Matches conservative free-tier default until subscription store hydrates. */
  getMaxPets: () => 1,
  getPlan: () => PLAN_FREE,
  getEntitlementSource: () => 'free',
  isEntitlementServerSynced: () => false,
  areNotificationsEnabled: () => true,
};

let snapshot: AppSessionSnapshot = defaultSnapshot;

const listeners = new Set<() => void>();

export function replaceAppSessionSnapshot(next: AppSessionSnapshot): void {
  snapshot = next;
  listeners.forEach(listener => listener());
}

export function subscribeAppSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAppSessionUserId(): string | null {
  return snapshot.getUserId();
}

export function getAppSessionMaxPets(): number {
  return applyDevMaxPetsOverride(snapshot.getMaxPets(), __DEV__);
}

export function getAppSessionPlan(): PlanKey {
  return snapshot.getPlan();
}

export function getAppSessionEntitlementSource(): EntitlementSource {
  return snapshot.getEntitlementSource();
}

export function isAppSessionEntitlementServerSynced(): boolean {
  return snapshot.isEntitlementServerSynced();
}

export function areAppSessionNotificationsEnabled(): boolean {
  return snapshot.areNotificationsEnabled();
}

export function getAppSessionValues(): AppSessionValues {
  return {
    userId: snapshot.getUserId(),
    maxPets: applyDevMaxPetsOverride(snapshot.getMaxPets(), __DEV__),
    plan: snapshot.getPlan(),
    entitlementSource: snapshot.getEntitlementSource(),
    entitlementServerSynced: snapshot.isEntitlementServerSynced(),
    notificationsEnabled: snapshot.areNotificationsEnabled(),
  };
}
