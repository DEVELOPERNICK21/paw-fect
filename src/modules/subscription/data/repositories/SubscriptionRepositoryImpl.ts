import type { ComputedEntitlement } from '../../../../shared/subscription/entitlementEngine';
import type {
  PlayStorePlanKey,
  SubscriptionRepository,
} from '../../domain/repositories/SubscriptionRepository';
import {
  createSubscriptionRemoteDataSource,
  type SubscriptionRemoteDataSource,
} from '../datasources/SubscriptionRemoteDataSource';

export class SubscriptionRepositoryImpl implements SubscriptionRepository {
  constructor(private readonly remote: SubscriptionRemoteDataSource) {}

  observeEntitlement(
    userId: string,
    onUpdate: (entitlement: ComputedEntitlement) => void,
  ): () => void {
    return this.remote.observeEntitlement(userId, onUpdate);
  }

  stopObserving(): void {
    this.remote.stopObserving();
  }

  refreshBootstrap(): Promise<ComputedEntitlement> {
    return this.remote.refreshBootstrap();
  }

  checkoutStore(
    planKey: PlayStorePlanKey,
    billingPeriod: 'monthly' | 'annual',
  ): Promise<ComputedEntitlement> {
    return this.remote.checkoutStore(planKey, billingPeriod);
  }

  restorePurchases(): Promise<ComputedEntitlement> {
    return this.remote.restorePurchases();
  }
}

export const createSubscriptionRepository = (): SubscriptionRepository =>
  new SubscriptionRepositoryImpl(createSubscriptionRemoteDataSource());
