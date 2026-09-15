import { getAuth } from '@react-native-firebase/auth';
import { create } from 'zustand';

import {
  presentRevenueCatCustomerCenter,
  presentRevenueCatPaywall,
  waitForEntitlementSync,
} from '../../../infrastructure/purchases/revenueCatClient';
import { computeEntitlement } from '../../../shared/subscription/entitlementEngine';
import type { ComputedEntitlement } from '../../../shared/subscription/entitlementEngine';
import { PLAN_CARE_PLUS, PLAN_FAMILY } from '../../../shared/subscription/planCatalog';
import { subscriptionComposition } from '../subscriptionComposition';

const defaultEntitlement = (): ComputedEntitlement =>
  computeEntitlement({
    now: new Date(),
    trialEndsAt: null,
    trialConsumed: true,
    subscription: null,
  });

const requireUid = (): string => {
  const uid = getAuth().currentUser?.uid?.trim();
  if (!uid) {
    throw new Error('Sign in before managing your subscription.');
  }
  return uid;
};

export interface SubscriptionState {
  entitlement: ComputedEntitlement;
  serverSynced: boolean;
  checkoutLoading: boolean;
  checkoutError: string | null;
  startListening: (userId: string) => void;
  stopListening: () => void;
  refreshBootstrap: () => Promise<void>;
  startStoreCheckout: (
    planKey: typeof PLAN_CARE_PLUS | typeof PLAN_FAMILY,
    billingPeriod: 'monthly' | 'annual',
  ) => Promise<void>;
  /** @deprecated Use startStoreCheckout */
  startPlayStoreCheckout: (
    planKey: typeof PLAN_CARE_PLUS | typeof PLAN_FAMILY,
    billingPeriod: 'monthly' | 'annual',
  ) => Promise<void>;
  restorePurchases: () => Promise<void>;
  /** Opens RevenueCat Paywalls UI (dashboard-designed paywall). */
  presentRcPaywall: () => Promise<void>;
  /** Opens RevenueCat Customer Center (manage / cancel / restore). */
  openCustomerCenter: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  entitlement: defaultEntitlement(),
  serverSynced: false,
  checkoutLoading: false,
  checkoutError: null,

  startListening: userId => {
    subscriptionComposition.stopObservingEntitlement.execute();
    subscriptionComposition.observeEntitlement.execute(userId, entitlement => {
      set({ entitlement, serverSynced: true });
    });
  },

  stopListening: () => {
    subscriptionComposition.stopObservingEntitlement.execute();
    set({
      entitlement: defaultEntitlement(),
      serverSynced: false,
      checkoutError: null,
    });
  },

  refreshBootstrap: async () => {
    try {
      const entitlement =
        await subscriptionComposition.refreshEntitlementBootstrap.execute();
      set({ entitlement, serverSynced: true, checkoutError: null });
    } catch {
      /* offline or misconfiguration — Firestore listener may still update */
    }
  },

  startStoreCheckout: async (planKey, billingPeriod) => {
    set({ checkoutLoading: true, checkoutError: null });
    try {
      const entitlement =
        await subscriptionComposition.checkoutStoreSubscription.execute(
          planKey,
          billingPeriod,
        );
      set({ entitlement, serverSynced: true });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Checkout was cancelled or failed.';
      set({ checkoutError: message });
    } finally {
      set({ checkoutLoading: false });
    }
  },

  startPlayStoreCheckout: async (planKey, billingPeriod) => {
    await get().startStoreCheckout(planKey, billingPeriod);
  },

  restorePurchases: async () => {
    set({ checkoutLoading: true, checkoutError: null });
    try {
      const entitlement =
        await subscriptionComposition.restoreStorePurchases.execute();
      set({ entitlement, serverSynced: true });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Restore was cancelled or failed.';
      set({ checkoutError: message });
    } finally {
      set({ checkoutLoading: false });
    }
  },

  presentRcPaywall: async () => {
    set({ checkoutLoading: true, checkoutError: null });
    // Native presentPaywall can fail to resolve after dismiss on some devices;
    // never leave Settings permanently disabled.
    const unlockTimer = setTimeout(() => {
      if (get().checkoutLoading) {
        set({ checkoutLoading: false });
      }
    }, 2000);
    try {
      const uid = requireUid();
      const outcome = await presentRevenueCatPaywall(uid);
      clearTimeout(unlockTimer);
      // Unlock UI as soon as the native paywall closes — do not wait on sync.
      set({ checkoutLoading: false });

      if (outcome === 'cancelled' || outcome === 'not_presented') {
        return;
      }
      if (outcome === 'error') {
        set({
          checkoutError:
            'Unable to open the subscription paywall. Check RevenueCat Paywall is published for the default offering.',
        });
        return;
      }
      const synced = await waitForEntitlementSync(() =>
        subscriptionComposition.refreshEntitlementBootstrap.execute(),
      );
      if (synced) {
        set({ entitlement: synced, serverSynced: true });
        return;
      }
      await get().refreshBootstrap();
    } catch (e) {
      clearTimeout(unlockTimer);
      const message =
        e instanceof Error ? e.message : 'Unable to present paywall.';
      set({ checkoutError: message, checkoutLoading: false });
    } finally {
      clearTimeout(unlockTimer);
      set({ checkoutLoading: false });
    }
  },

  openCustomerCenter: async () => {
    set({ checkoutLoading: true, checkoutError: null });
    try {
      const uid = requireUid();
      await presentRevenueCatCustomerCenter(uid);
      set({ checkoutLoading: false });
      await get().refreshBootstrap();
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Unable to open subscription management.';
      set({ checkoutError: message, checkoutLoading: false });
    } finally {
      set({ checkoutLoading: false });
    }
  },
}));
