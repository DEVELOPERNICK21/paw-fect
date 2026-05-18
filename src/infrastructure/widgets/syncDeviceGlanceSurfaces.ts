import { NativeModules, Platform } from 'react-native';

import type { HomeDashboardViewModel } from '../../modules/app/domain/models/HomeDashboardViewModel';
import type { Pet } from '../../modules/pets/domain/models/Pet';
import type { DailySchedule } from '../../modules/schedule/domain/models/DailySchedule';

import {
  buildWidgetSnapshot,
  serializeWidgetSnapshot,
} from './widgetSnapshot';

type WidgetDataModuleType = {
  sync: (json: string) => void;
};

export interface GlanceSurfacesInput {
  pet: Pet;
  viewModel?: HomeDashboardViewModel | null;
  schedule?: DailySchedule | null;
}

function pushSnapshot(input: GlanceSurfacesInput): void {
  const snapshot = buildWidgetSnapshot({
    pet: input.pet,
    viewModel: input.viewModel,
    schedule: input.schedule,
    updatedAt: input.viewModel?.now ?? new Date().toISOString(),
  });
  const json = serializeWidgetSnapshot(snapshot);

  if (Platform.OS === 'android') {
    const mod = NativeModules.WidgetDataModule as WidgetDataModuleType | undefined;
    if (mod?.sync != null) {
      try {
        mod.sync(json);
      } catch {
        // ignore bridge errors in dev
      }
    }
    return;
  }

  if (Platform.OS === 'ios') {
    const mod = NativeModules.WidgetDataModule as WidgetDataModuleType | undefined;
    if (mod?.sync != null) {
      try {
        mod.sync(json);
      } catch {
        // ignore bridge errors until extension is linked
      }
    }
  }
}

/**
 * Updates Android home + lock widgets and iOS WidgetKit shared storage.
 */
export function syncDeviceGlanceSurfaces(input: GlanceSurfacesInput): void {
  pushSnapshot(input);
}

/** @deprecated Use syncDeviceGlanceSurfaces */
export function syncDeviceHomeWidgets(
  vm: HomeDashboardViewModel,
  pet: Pet,
): void {
  syncDeviceGlanceSurfaces({ pet, viewModel: vm });
}
