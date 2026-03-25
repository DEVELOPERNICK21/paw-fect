import type { HomeDashboardViewModel } from '../models/HomeDashboardViewModel';

export interface HomeDashboardObserver {
  next: (vm: HomeDashboardViewModel) => void;
}

export interface HomeDashboardObservationSubscription {
  unsubscribe: () => void;
}

export interface HomeDashboardObservationHandle {
  subscribe(observer: HomeDashboardObserver): HomeDashboardObservationSubscription;
}

/**
 * Dashboard SSOT observation + invalidation-driven rebuilds.
 * Implemented by {@link ObserveHomeDashboard}; injected into {@link AppOrchestrator}.
 */
export interface ObserveHomeDashboardPort {
  execute(): HomeDashboardObservationHandle;
}
