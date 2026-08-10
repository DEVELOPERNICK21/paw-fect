import { MATERIAL_ICON_NAMES } from '../MaterialIcon';

const PUPPY_TAB_ICONS = [
  'home_paw',
  'home_paw_outline',
  'bone_cross',
  'bone_cross_outline',
  'heart_paw',
  'heart_paw_outline',
  'collar_settings',
  'collar_settings_outline',
] as const;

describe('MaterialIcon puppy tab paths', () => {
  it.each(PUPPY_TAB_ICONS)('registers %s', name => {
    expect(MATERIAL_ICON_NAMES).toContain(name);
  });
});
