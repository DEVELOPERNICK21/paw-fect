import type { ComputedEntitlement } from '../../../../shared/subscription/entitlementEngine';
import type {
  PLAN_CARE_PLUS,
  PLAN_FAMILY,
} from '../../../../shared/subscription/planCatalog';

export type PlayStorePlanKey = typeof PLAN_CARE_PLUS | typeof PLAN_FAMILY;

export interface SubscriptionRepository {
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
