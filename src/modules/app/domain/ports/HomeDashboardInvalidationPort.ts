export type HomeDashboardInvalidationUnsubscribe = () => void;

/**
 * Explicit invalidation signal for the home dashboard observation pipeline.
 * Implemented in the application layer; domain use cases depend only on this port.
 */
export interface HomeDashboardInvalidationPort {
  subscribe(onInvalidate: () => void): HomeDashboardInvalidationUnsubscribe;
  notify(): void;
}
