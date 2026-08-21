import type { ComputedEntitlement } from '../../../../shared/subscription/entitlementEngine';
import type { SubscriptionRepository } from '../repositories/SubscriptionRepository';

export class RefreshEntitlementBootstrap {
  constructor(private readonly repository: SubscriptionRepository) {}

  async execute(): Promise<ComputedEntitlement> {
    return this.repository.refreshBootstrap();
  }
}
