import { create } from 'zustand';

import type { HomeDashboardViewModel } from '../domain/models/HomeDashboardViewModel';

/**
 * Projection store (rules §4): holds the home dashboard ViewModel only.
 * `setViewModel` is driven by ObserveHomeDashboard via AppOrchestrator.
 * `requestDashboardRefresh` is the UI-facing hook; composition registers the real handler.
 */
let dashboardRefreshImpl: (() => void) | undefined;

/** Called once from `appComposition` to connect refresh → orchestrator (no UI import of orchestrator). */
export function registerHomeDashboardRefresh(handler: () => void): void {
  dashboardRefreshImpl = handler;
}

export const useHomeDashboardStore = create<{
  viewModel: HomeDashboardViewModel | null;
  setViewModel: (vm: HomeDashboardViewModel) => void;
  /** UI → Store only: asks for a fresh dashboard read (invalidates observation). */
  requestDashboardRefresh: () => void;
}>((set) => ({
  viewModel: null,
  setViewModel: (vm) => set({ viewModel: vm }),
  requestDashboardRefresh: () => {
    dashboardRefreshImpl?.();
  },
}));
