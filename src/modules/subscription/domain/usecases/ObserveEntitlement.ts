import type { ComputedEntitlement } from '../../../../shared/subscription/entitlementEngine';
import type { SubscriptionRepository } from '../repositories/SubscriptionRepository';

export class ObserveEntitlement {
  constructor(private readonly repository: SubscriptionRepository) {}

  execute(
    userId: string,
    onUpdate: (entitlement: ComputedEntitlement) => void,
  ): () => void {
    return this.repository.observeEntitlement(userId, onUpdate);
  }
}
