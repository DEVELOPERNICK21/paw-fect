import { create } from 'zustand';

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

export interface SubscriptionState {
  entitlement: ComputedEntitlement;
  serverSynced: boolean;
  checkoutLoading: boolean;
  checkoutError: string | null;
  startListening: (userId: string) => void;
  stopListening: () => void;
  refreshBootstrap: () => Promise<void>;
  startPlayStoreCheckout: (
    planKey: typeof PLAN_CARE_PLUS | typeof PLAN_FAMILY,
    billingPeriod: 'monthly' | 'annual',
  ) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>(set => ({
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

  startPlayStoreCheckout: async (planKey, billingPeriod) => {
    set({ checkoutLoading: true, checkoutError: null });
    try {
      const entitlement =
        await subscriptionComposition.checkoutPlayStoreSubscription.execute(
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
}));
