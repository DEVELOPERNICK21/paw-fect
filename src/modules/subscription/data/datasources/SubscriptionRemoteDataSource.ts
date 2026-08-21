import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';

import type { ComputedEntitlement } from '../../../../shared/subscription/entitlementEngine';
import { playProductIdFor } from '../../../../shared/subscription/playStoreCatalog';
import { parseFirestoreEntitlement } from '../../domain/parseFirestoreEntitlement';
import type { PlayStorePlanKey } from '../../domain/repositories/SubscriptionRepository';
import {
  postEntitlementBootstrap,
  postVerifyGooglePlaySubscription,
} from '../subscriptionApi';

export interface SubscriptionRemoteDataSource {
  observeEntitlement(
    userId: string,
    onUpdate: (entitlement: ComputedEntitlement) => void,
  ): () => void;
  stopObserving(): void;
  refreshBootstrap(): Promise<ComputedEntitlement>;
  checkoutPlayStore(
    planKey: PlayStorePlanKey,
    billingPeriod: 'monthly' | 'annual',
  ): Promise<ComputedEntitlement>;
}

class SubscriptionRemoteDataSourceImpl implements SubscriptionRemoteDataSource {
  private firestoreUnsub: (() => void) | null = null;

  observeEntitlement(
    userId: string,
    onUpdate: (entitlement: ComputedEntitlement) => void,
  ): () => void {
    this.firestoreUnsub?.();
    this.firestoreUnsub = firestore()
      .collection('users')
      .doc(userId)
      .onSnapshot(
        snap => {
          try {
            const parsed = parseFirestoreEntitlement(snap.data()?.entitlement);
            if (parsed) {
              onUpdate(parsed);
            }
          } catch {
            /* malformed snapshot — keep last entitlement */
          }
        },
        () => {
          /* keep last known entitlement */
        },
      );
    return () => {
      this.firestoreUnsub?.();
      this.firestoreUnsub = null;
    };
  }

  stopObserving(): void {
    this.firestoreUnsub?.();
    this.firestoreUnsub = null;
  }

  refreshBootstrap(): Promise<ComputedEntitlement> {
    return postEntitlementBootstrap();
  }

  async checkoutPlayStore(
    planKey: PlayStorePlanKey,
    billingPeriod: 'monthly' | 'annual',
  ): Promise<ComputedEntitlement> {
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
    await iap.finishTransaction({ purchase, isConsumable: false });
    return entitlement;
  }
}

export const createSubscriptionRemoteDataSource = (): SubscriptionRemoteDataSource =>
  new SubscriptionRemoteDataSourceImpl();
