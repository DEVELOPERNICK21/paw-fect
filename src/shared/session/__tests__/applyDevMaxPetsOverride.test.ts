import { PLAN_CARE_PLUS, PLAN_CATALOG } from '../../subscription/planCatalog';
import { applyDevMaxPetsOverride } from '../applyDevMaxPetsOverride';

describe('applyDevMaxPetsOverride', () => {
  const carePlusMax = PLAN_CATALOG[PLAN_CARE_PLUS].maxPets;

  it('returns the real cap in release builds', () => {
    expect(applyDevMaxPetsOverride(1, false)).toBe(1);
    expect(applyDevMaxPetsOverride(10, false)).toBe(10);
  });

  it('lifts a free cap to Care+ in debug builds', () => {
    expect(applyDevMaxPetsOverride(1, true)).toBe(carePlusMax);
  });

  it('does not lower a paid cap in debug builds', () => {
    expect(applyDevMaxPetsOverride(10, true)).toBe(10);
  });
});
