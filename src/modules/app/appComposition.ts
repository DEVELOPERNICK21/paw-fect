/**
 * Composition root for the app shell: repositories, dashboard use cases, orchestrator.
 */
import { useAuthStore } from '../auth/store/authStore';
import { createPetRepository } from '../pets/data/repositories/PetRepositoryImpl';
import { createReminderRepository } from '../reminders/data/repositories/ReminderRepositoryImpl';
import { createHealthRecordRepository } from '../records/data/repositories/HealthRecordRepositoryImpl';
import { createSmartHealthRecordRepository } from '../records/data/repositories/SmartHealthRecordRepositoryImpl';

import { AppOrchestrator } from './application/AppOrchestrator';
import { HomeDashboardInvalidationHub } from './application/HomeDashboardInvalidationHub';
import type { HomeDashboardViewModel } from './domain/models/HomeDashboardViewModel';
import { BuildHomeDashboardViewModel } from './domain/usecases/BuildHomeDashboardViewModel';
import { ObserveHomeDashboard } from './domain/usecases/ObserveHomeDashboard';
import { syncDeviceGlanceSurfaces } from '../../infrastructure/widgets/syncDeviceGlanceSurfaces';
import { getTodayIsoDateLocal } from '../../shared/utils/calendarDate';
import { scheduleComposition } from '../schedule/scheduleComposition';
import {
  registerHomeDashboardRefresh,
  useHomeDashboardStore,
} from './store/homeDashboardStore';

const homeDashboardInvalidationHub = new HomeDashboardInvalidationHub();

const petRepository = createPetRepository();
const reminderRepository = createReminderRepository();
const healthRecordRepository = createHealthRecordRepository();
const smartHealthRecordRepository = createSmartHealthRecordRepository();

const buildHomeDashboardViewModel = new BuildHomeDashboardViewModel();

const observeHomeDashboard = new ObserveHomeDashboard(
  petRepository,
  reminderRepository,
  healthRecordRepository,
  smartHealthRecordRepository,
  buildHomeDashboardViewModel,
  () => useAuthStore.getState().user?.id ?? null,
  homeDashboardInvalidationHub,
);

let glanceSyncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleGlanceSurfacesSync(): void {
  if (glanceSyncTimer != null) {
    clearTimeout(glanceSyncTimer);
  }
  glanceSyncTimer = setTimeout(() => {
    glanceSyncTimer = null;
    const vm = useHomeDashboardStore.getState().viewModel;
    if (vm?.activePet != null) {
      void pushGlanceSurfacesForDashboard(vm).catch(() => {});
    }
  }, 800);
}

/** Single app orchestrator: start/stop dashboard observation, explicit invalidation. */
async function pushGlanceSurfacesForDashboard(
  vm: HomeDashboardViewModel,
): Promise<void> {
  const pet = vm.activePet;
  if (pet == null) {
    return;
  }
  const userId = useAuthStore.getState().user?.id ?? null;
  if (userId == null) {
    syncDeviceGlanceSurfaces({ pet, viewModel: vm });
    return;
  }
  const schedule = await scheduleComposition.buildDailySchedule.execute({
    userId,
    petId: pet.id,
    date: getTodayIsoDateLocal(),
  });
  syncDeviceGlanceSurfaces({
    pet,
    viewModel: vm,
    schedule: schedule ?? undefined,
  });
}

export const appOrchestrator = new AppOrchestrator(
  observeHomeDashboard,
  vm => {
    useHomeDashboardStore.getState().setViewModel(vm);
    if (vm.activePet != null) {
      scheduleGlanceSurfacesSync();
    }
  },
  homeDashboardInvalidationHub,
);

registerHomeDashboardRefresh(() => {
  appOrchestrator.invalidateHomeDashboard();
});

export const appComposition = {
  buildHomeDashboardViewModel,
} as const;
