import { MATERIAL_ICON_NAMES } from '../MaterialIcon';

const MATERIAL_TAB_ICONS = [
  'home',
  'home_outline',
  'favorite',
  'favorite_outline',
  'wellness',
  'wellness_outline',
  'settings',
  'settings_outline',
] as const;

describe('MaterialIcon tab paths', () => {
  it.each(MATERIAL_TAB_ICONS)('registers %s', name => {
    expect(MATERIAL_ICON_NAMES).toContain(name);
  });
});
