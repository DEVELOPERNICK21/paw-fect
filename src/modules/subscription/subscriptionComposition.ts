/**
 * Composition root for subscription: wires repository to use cases.
 */
import { createSubscriptionRepository } from './data/repositories/SubscriptionRepositoryImpl';
import { CheckoutPlayStoreSubscription } from './domain/usecases/CheckoutPlayStoreSubscription';
import { ObserveEntitlement } from './domain/usecases/ObserveEntitlement';
import { RefreshEntitlementBootstrap } from './domain/usecases/RefreshEntitlementBootstrap';
import { StopObservingEntitlement } from './domain/usecases/StopObservingEntitlement';

const repository = createSubscriptionRepository();

export const subscriptionComposition = {
  observeEntitlement: new ObserveEntitlement(repository),
  stopObservingEntitlement: new StopObservingEntitlement(repository),
  refreshEntitlementBootstrap: new RefreshEntitlementBootstrap(repository),
  checkoutPlayStoreSubscription: new CheckoutPlayStoreSubscription(repository),
} as const;
