import { PLAN_CARE_PLUS, PLAN_CATALOG } from '../subscription/planCatalog';

/**
 * Debug builds only: lift the free-tier pet cap to Care+ so multi-pet UX
 * can be exercised without a paid entitlement. Never raises a paid cap.
 * Release Metro dead-code-eliminates the `__DEV__` call site.
 */
export function applyDevMaxPetsOverride(
  realMaxPets: number,
  isDev: boolean,
): number {
  if (!isDev) {
    return realMaxPets;
  }
  return Math.max(realMaxPets, PLAN_CATALOG[PLAN_CARE_PLUS].maxPets);
}
