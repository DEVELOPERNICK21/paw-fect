import type { HomeDashboardViewModel } from '../domain/models/HomeDashboardViewModel';
import type { HomeDashboardInvalidationPort } from '../domain/ports/HomeDashboardInvalidationPort';
import type { ObserveHomeDashboardPort } from '../domain/ports/ObserveHomeDashboardPort';
import { createLoggedOutHomeDashboardViewModel } from '../domain/usecases/BuildHomeDashboardViewModel';

export interface AuthenticatedDataSyncDeps {
  resetPets: () => void;
  resetReminders: () => void;
  resetRecords: () => void;
  loadPets: () => Promise<void>;
  loadReminders: () => Promise<void>;
  loadRecords: () => Promise<void>;
}

/**
 * Application orchestrator (rules §5): init / refresh / logout coordination.
 * No business logic; no UI. May update projection stores and call command-store loaders.
 */
export class AppOrchestrator {
  private dashboardUnsubscribe: (() => void) | null = null;

  constructor(
    private readonly observeHomeDashboard: ObserveHomeDashboardPort,
    private readonly setHomeDashboardViewModel: (vm: HomeDashboardViewModel) => void,
    private readonly homeDashboardInvalidation: HomeDashboardInvalidationPort,
  ) {}

  startHomeDashboardObservation(): void {
    this.stopHomeDashboardObservation();
    const { unsubscribe } = this.observeHomeDashboard.execute().subscribe({
      next: vm => this.setHomeDashboardViewModel(vm),
    });
    this.dashboardUnsubscribe = unsubscribe;
  }

  stopHomeDashboardObservation(): void {
    this.dashboardUnsubscribe?.();
    this.dashboardUnsubscribe = null;
  }

  invalidateHomeDashboard(): void {
    this.homeDashboardInvalidation.notify();
  }

  /** Logout cleanup: stop observation, clear dashboard projection, reset feature caches. */
  clearSessionData(deps: Pick<AuthenticatedDataSyncDeps, 'resetPets' | 'resetReminders' | 'resetRecords'>): void {
    this.stopHomeDashboardObservation();
    this.setHomeDashboardViewModel(createLoggedOutHomeDashboardViewModel());
    deps.resetPets();
    deps.resetReminders();
    deps.resetRecords();
  }

  /**
   * After login: start dashboard observation, reload command stores, then refresh dashboard VM.
   * @param resetCaches When false, keeps in-memory stores (e.g. bootstrap already loaded pets).
   */
  async syncAuthenticatedDataStores(
    deps: AuthenticatedDataSyncDeps,
    options?: { resetCaches?: boolean },
  ): Promise<void> {
    const resetCaches = options?.resetCaches ?? true;
    if (resetCaches) {
      deps.resetPets();
      deps.resetReminders();
      deps.resetRecords();
    }
    this.startHomeDashboardObservation();
    await Promise.all([deps.loadPets(), deps.loadReminders(), deps.loadRecords()]);
    this.invalidateHomeDashboard();
  }

  /** Starts dashboard observation and invalidates without touching feature stores. */
  refreshHomeDashboardObservation(): void {
    this.startHomeDashboardObservation();
    this.invalidateHomeDashboard();
  }
}
