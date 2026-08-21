import type { ComputedEntitlement } from '../../../../shared/subscription/entitlementEngine';
import type {
  PlayStorePlanKey,
  SubscriptionRepository,
} from '../repositories/SubscriptionRepository';

export class CheckoutPlayStoreSubscription {
  constructor(private readonly repository: SubscriptionRepository) {}

  async execute(
    planKey: PlayStorePlanKey,
    billingPeriod: 'monthly' | 'annual',
  ): Promise<ComputedEntitlement> {
    return this.repository.checkoutPlayStore(planKey, billingPeriod);
  }
}
