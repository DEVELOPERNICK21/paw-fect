/**
 * Composition root for subscription: wires repository to use cases.
 */
import { createSubscriptionRepository } from './data/repositories/SubscriptionRepositoryImpl';
import { CheckoutStoreSubscription } from './domain/usecases/CheckoutStoreSubscription';
import { ObserveEntitlement } from './domain/usecases/ObserveEntitlement';
import { RefreshEntitlementBootstrap } from './domain/usecases/RefreshEntitlementBootstrap';
import { RestoreStorePurchases } from './domain/usecases/RestoreStorePurchases';
import { StopObservingEntitlement } from './domain/usecases/StopObservingEntitlement';

const repository = createSubscriptionRepository();

export const subscriptionComposition = {
  observeEntitlement: new ObserveEntitlement(repository),
  stopObservingEntitlement: new StopObservingEntitlement(repository),
  refreshEntitlementBootstrap: new RefreshEntitlementBootstrap(repository),
  checkoutStoreSubscription: new CheckoutStoreSubscription(repository),
  restoreStorePurchases: new RestoreStorePurchases(repository),
} as const;
