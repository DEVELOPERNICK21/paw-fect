import type { SubscriptionRepository } from '../repositories/SubscriptionRepository';

export class StopObservingEntitlement {
  constructor(private readonly repository: SubscriptionRepository) {}

  execute(): void {
    this.repository.stopObserving();
  }
}
