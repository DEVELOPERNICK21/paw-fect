import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';

import {
  purchaseStorePackage,
  restoreRevenueCatPurchases,
  waitForEntitlementSync,
} from '../../../../infrastructure/purchases/revenueCatClient';
import type { ComputedEntitlement } from '../../../../shared/subscription/entitlementEngine';
import { parseFirestoreEntitlement } from '../../domain/parseFirestoreEntitlement';
import type { PlayStorePlanKey } from '../../domain/repositories/SubscriptionRepository';
import { postEntitlementBootstrap } from '../subscriptionApi';

export interface SubscriptionRemoteDataSource {
  observeEntitlement(
    userId: string,
    onUpdate: (entitlement: ComputedEntitlement) => void,
  ): () => void;
  stopObserving(): void;
  refreshBootstrap(): Promise<ComputedEntitlement>;
  checkoutStore(
    planKey: PlayStorePlanKey,
    billingPeriod: 'monthly' | 'annual',
  ): Promise<ComputedEntitlement>;
  restorePurchases(): Promise<ComputedEntitlement>;
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

  async checkoutStore(
    planKey: PlayStorePlanKey,
    billingPeriod: 'monthly' | 'annual',
  ): Promise<ComputedEntitlement> {
    if (Platform.OS === 'ios') {
      throw new Error(
        'App Store subscriptions are not available in this build yet.',
      );
    }
    await purchaseStorePackage(planKey, billingPeriod);
    await waitForEntitlementSync(() => this.refreshBootstrap());
    const entitlement = await this.refreshBootstrap();
    return entitlement;
  }

  async restorePurchases(): Promise<ComputedEntitlement> {
    await restoreRevenueCatPurchases();
    await waitForEntitlementSync(() => this.refreshBootstrap());
    return this.refreshBootstrap();
  }
}

export const createSubscriptionRemoteDataSource = (): SubscriptionRemoteDataSource =>
  new SubscriptionRemoteDataSourceImpl();
