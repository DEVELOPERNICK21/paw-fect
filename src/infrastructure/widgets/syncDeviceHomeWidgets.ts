import { NativeModules, Platform } from 'react-native';

import type { HomeDashboardViewModel } from '../../modules/app/domain/models/HomeDashboardViewModel';
import type { Pet } from '../../modules/pets/domain/models/Pet';

type WidgetDataModuleType = {
  sync: (json: string) => void;
};

function buildPayload(vm: HomeDashboardViewModel, pet: Pet): string {
  const m = vm.nextMilestone;
  const tasks = vm.todayCare.slice(0, 5).map(item => {
    const t = item.reminder.time.trim();
    const subtitle =
      !t || /^all\s*day$/i.test(t)
        ? 'All day'
        : item.showCompletedCheck
          ? `Done at ${t}`
          : t;
    return {
      title: item.reminder.title,
      subtitle,
      done: item.showCompletedCheck,
    };
  });

  return JSON.stringify({
    petName: pet.name,
    breed:
      pet.breed?.trim() ||
      (pet.type === 'dog' ? 'Dog' : pet.type === 'cat' ? 'Cat' : 'Pet'),
    milestone:
      m == null
        ? null
        : {
            title: m.title,
            dueDateLabel: m.dueDateLabel,
            countdownLabel: m.countdownLabel,
            dueDateYmd: m.dueDateYmd,
            kind: m.kind,
          },
    tasks,
    updatedAt: vm.now,
  });
}

/**
 * Pushes home dashboard snapshot to Android App Widgets (device home screen).
 * iOS widgets require a separate Widget Extension target in Xcode.
 */
export function syncDeviceHomeWidgets(
  vm: HomeDashboardViewModel,
  pet: Pet,
): void {
  if (Platform.OS !== 'android') {
    return;
  }
  const mod = NativeModules.WidgetDataModule as WidgetDataModuleType | undefined;
  if (mod?.sync == null) {
    return;
  }
  try {
    mod.sync(buildPayload(vm, pet));
  } catch {
    // ignore bridge errors in dev
  }
}
