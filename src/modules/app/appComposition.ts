/**
 * Composition root for the app shell: repositories, dashboard use cases, orchestrator.
 */
import { useAuthStore } from '../auth/store/authStore';
import { createPetRepository } from '../pets/data/repositories/PetRepositoryImpl';
import { createReminderRepository } from '../reminders/data/repositories/ReminderRepositoryImpl';
import { createHealthRecordRepository } from '../records/data/repositories/HealthRecordRepositoryImpl';

import { AppOrchestrator } from './application/AppOrchestrator';
import { HomeDashboardInvalidationHub } from './application/HomeDashboardInvalidationHub';
import { BuildHomeDashboardViewModel } from './domain/usecases/BuildHomeDashboardViewModel';
import { ObserveHomeDashboard } from './domain/usecases/ObserveHomeDashboard';
import {
  registerHomeDashboardRefresh,
  useHomeDashboardStore,
} from './store/homeDashboardStore';

const homeDashboardInvalidationHub = new HomeDashboardInvalidationHub();

const petRepository = createPetRepository();
const reminderRepository = createReminderRepository();
const healthRecordRepository = createHealthRecordRepository();

const buildHomeDashboardViewModel = new BuildHomeDashboardViewModel();

const observeHomeDashboard = new ObserveHomeDashboard(
  petRepository,
  reminderRepository,
  healthRecordRepository,
  buildHomeDashboardViewModel,
  () => useAuthStore.getState().user?.id ?? null,
  homeDashboardInvalidationHub,
);

/** Single app orchestrator: start/stop dashboard observation, explicit invalidation. */
export const appOrchestrator = new AppOrchestrator(
  observeHomeDashboard,
  (vm) => useHomeDashboardStore.getState().setViewModel(vm),
  homeDashboardInvalidationHub,
);

registerHomeDashboardRefresh(() => {
  appOrchestrator.invalidateHomeDashboard();
});

export const appComposition = {
  buildHomeDashboardViewModel,
} as const;
