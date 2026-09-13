import { getAuth } from '@react-native-firebase/auth';
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

const requireSignedInUid = (): string => {
  const uid = getAuth().currentUser?.uid?.trim();
  if (!uid) {
    throw new Error('Sign in before purchasing or restoring a subscription.');
  }
  return uid;
};

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
    if (Platform.OS !== 'android') {
      throw new Error('Store subscriptions are only available on Android.');
    }
    const uid = requireSignedInUid();
    await purchaseStorePackage(uid, planKey, billingPeriod);
    const synced = await waitForEntitlementSync(() => this.refreshBootstrap());
    if (synced) {
      return synced;
    }
    try {
      return await this.refreshBootstrap();
    } catch {
      // Purchase already completed with the store; entitlement may arrive via
      // webhook + Firestore listener shortly.
      throw new Error(
        'Purchase completed. Your plan will update in a moment — pull to refresh if needed.',
      );
    }
  }

  async restorePurchases(): Promise<ComputedEntitlement> {
    const uid = requireSignedInUid();
    await restoreRevenueCatPurchases(uid);
    const synced = await waitForEntitlementSync(() => this.refreshBootstrap());
    if (synced) {
      return synced;
    }
    try {
      return await this.refreshBootstrap();
    } catch {
      throw new Error(
        'Restore finished. Your plan will update in a moment if a subscription was found.',
      );
    }
  }
}

export const createSubscriptionRemoteDataSource = (): SubscriptionRemoteDataSource =>
  new SubscriptionRemoteDataSourceImpl();
