import type {
  HomeDashboardInvalidationPort,
  HomeDashboardInvalidationUnsubscribe,
} from '../domain/ports/HomeDashboardInvalidationPort';

/**
 * Application-layer implementation of {@link HomeDashboardInvalidationPort}.
 */
export class HomeDashboardInvalidationHub implements HomeDashboardInvalidationPort {
  private readonly listeners = new Set<() => void>();

  subscribe(onInvalidate: () => void): HomeDashboardInvalidationUnsubscribe {
    this.listeners.add(onInvalidate);
    return () => {
      this.listeners.delete(onInvalidate);
    };
  }

  notify(): void {
    for (const fn of this.listeners) {
      try {
        fn();
      } catch {
        // Never let a listener break the bus
      }
    }
  }
}
