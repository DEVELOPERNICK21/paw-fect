import type { HomeDashboardViewModel } from '../../modules/app/domain/models/HomeDashboardViewModel';
import type { Pet } from '../../modules/pets/domain/models/Pet';

import { syncDeviceGlanceSurfaces } from './syncDeviceGlanceSurfaces';

/**
 * Pushes glance data to device widgets (home, lock screen, iOS WidgetKit).
 */
export function syncDeviceHomeWidgets(
  vm: HomeDashboardViewModel,
  pet: Pet,
): void {
  syncDeviceGlanceSurfaces({ pet, viewModel: vm });
}
