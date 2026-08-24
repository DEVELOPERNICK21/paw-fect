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
import { useSettingsStore } from '../settings/store/settingsStore';
import { petComposition } from '../pets/petComposition';
import { remindersComposition } from '../reminders/remindersComposition';
import {
  registerOnboardingActivationPort,
  registerOnboardingSettingsPort,
} from './store/onboardingCoordinationPorts';
import { wireNotificationFeaturePorts } from './application/registerNotificationFeaturePorts';
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

registerOnboardingSettingsPort({
  persistOnboardingCompletion: async input => {
    const currentSettings = useSettingsStore.getState().settings;
    if (!currentSettings) {
      return false;
    }
    await useSettingsStore.getState().updateSettings({
      ...currentSettings,
      careInterests: [...input.careInterests],
      onboardingCompleted: true,
      onboardingProfile: input.onboardingProfile,
    });
    const updatedSettings = useSettingsStore.getState().settings;
    return (
      updatedSettings?.onboardingCompleted === true &&
      Boolean(updatedSettings.onboardingProfile)
    );
  },
});

registerOnboardingActivationPort({
  createPetFromDraft: async ({ userId, pet }) => {
    if (pet.species === 'both') {
      return {
        ok: false,
        errorMessage: 'Please choose dog or cat to continue.',
      };
    }

    const profile = petComposition.createPetProfile.execute({
      userId,
      name: pet.nickname.trim(),
      type: pet.species === 'cat' ? 'cat' : 'dog',
    });
    if (!profile.ok) {
      return { ok: false, errorMessage: profile.errorMessage };
    }

    await petComposition.createPet.execute(userId, profile.pet);
    appOrchestrator.invalidateHomeDashboard();
    return { ok: true, petId: profile.pet.id };
  },
  createReminderFromDraft: async ({ petId, reminder }) => {
    const entry = remindersComposition.createReminderEntry.execute({
      petId,
      title: reminder.title,
      type: reminder.reminderType,
      date: reminder.date,
      time: reminder.time,
      repeat: reminder.repeat,
    });
    if (!entry.ok) {
      return { ok: false, errorMessage: entry.errorMessage };
    }

    await remindersComposition.createReminder.execute(entry.reminder);
    appOrchestrator.invalidateHomeDashboard();
    return { ok: true };
  },
});

wireNotificationFeaturePorts({
  invalidateHomeDashboard: () => appOrchestrator.invalidateHomeDashboard(),
});

export const appComposition = {
  buildHomeDashboardViewModel,
} as const;
