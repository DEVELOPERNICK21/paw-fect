import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { computeEntitlement } from '../../../shared/subscription/entitlementEngine';
import type { ComputedEntitlement } from '../../../shared/subscription/entitlementEngine';
import { PLAN_CARE_PLUS, PLAN_FAMILY } from '../../../shared/subscription/planCatalog';
import { playProductIdFor } from '../../../shared/subscription/playStoreCatalog';
import { parseFirestoreEntitlement } from '../domain/parseFirestoreEntitlement';
import {
  postEntitlementBootstrap,
  postVerifyGooglePlaySubscription,
} from '../data/subscriptionApi';

const defaultEntitlement = (): ComputedEntitlement =>
  computeEntitlement({
    now: new Date(),
    trialEndsAt: null,
    trialConsumed: true,
    subscription: null,
  });

let firestoreUnsub: (() => void) | null = null;

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

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  entitlement: defaultEntitlement(),
  serverSynced: false,
  checkoutLoading: false,
  checkoutError: null,

  startListening: (userId: string) => {
    firestoreUnsub?.();
    firestoreUnsub = firestore()
      .collection('users')
      .doc(userId)
      .onSnapshot(
        snap => {
          const parsed = parseFirestoreEntitlement(snap.data()?.entitlement);
          if (parsed) {
            set({ entitlement: parsed, serverSynced: true });
          }
        },
        () => {
          /* keep last known entitlement */
        },
      );
  },

  stopListening: () => {
    firestoreUnsub?.();
    firestoreUnsub = null;
    set({
      entitlement: defaultEntitlement(),
      serverSynced: false,
      checkoutError: null,
    });
  },

  refreshBootstrap: async () => {
    try {
      const entitlement = await postEntitlementBootstrap();
      set({ entitlement, serverSynced: true, checkoutError: null });
    } catch {
      /* offline or misconfiguration — Firestore listener may still update */
    }
  },

  startPlayStoreCheckout: async (planKey, billingPeriod) => {
    set({ checkoutLoading: true, checkoutError: null });
    try {
      if (Platform.OS !== 'android') {
        throw new Error(
          'Play Store subscriptions are available on Android only in this build.',
        );
      }
      const productId = playProductIdFor(planKey, billingPeriod);
      if (!productId) {
        throw new Error('Subscription product is not configured for this plan.');
      }

      type Purchase = {
        id?: string;
        purchaseToken?: string;
        transactionReceipt?: string;
      };
      type IapModule = {
        initConnection: () => Promise<boolean>;
        requestSubscription?: (input: {
          sku: string;
          subscriptionOffers?: Array<{ sku: string; offerToken: string }>;
        }) => Promise<Purchase>;
        requestPurchase?: (input: {
          request: {
            android: {
              skus: string[];
              subscriptionOffers?: Array<{ sku: string; offerToken: string }>;
            };
          };
          type: 'subs' | 'in-app';
        }) => Promise<Purchase>;
        finishTransaction: (params: {
          purchase: Purchase;
          isConsumable?: boolean;
        }) => Promise<void>;
      };
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const iap = require('react-native-iap') as IapModule;

      await iap.initConnection();
      const purchase = iap.requestPurchase
        ? await iap.requestPurchase({
            request: { android: { skus: [productId] } },
            type: 'subs',
          })
        : iap.requestSubscription
          ? await iap.requestSubscription({ sku: productId })
          : (() => {
              throw new Error(
                'In-app purchase module is missing purchase functions. Rebuild the app.',
              );
            })();
      const purchaseToken =
        purchase.purchaseToken ?? purchase.transactionReceipt ?? null;
      if (!purchaseToken) {
        throw new Error('Play Store purchase token was not returned.');
      }
      const entitlement = await postVerifyGooglePlaySubscription({
        purchaseToken,
        productId,
      });
      set({ entitlement, serverSynced: true });

      await iap.finishTransaction({ purchase, isConsumable: false });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Checkout was cancelled or failed.';
      set({ checkoutError: message });
    } finally {
      set({ checkoutLoading: false });
    }
  },
}));
