import {
  SIDE_TAB_ORDER,
  isSideTabActive,
  pillTranslateX,
  sideTabIndex,
} from '../pawTabBarMotion';

describe('pawTabBarMotion', () => {
  it('maps side tabs to stable indices and pets to null', () => {
    expect(SIDE_TAB_ORDER).toEqual([
      'home',
      'health',
      'notifications',
      'settings',
    ]);
    expect(sideTabIndex('home')).toBe(0);
    expect(sideTabIndex('health')).toBe(1);
    expect(sideTabIndex('notifications')).toBe(2);
    expect(sideTabIndex('settings')).toBe(3);
    expect(sideTabIndex('pets')).toBeNull();
  });

  it('treats only side tabs as pill-visible actives', () => {
    expect(isSideTabActive('home')).toBe(true);
    expect(isSideTabActive('pets')).toBe(false);
  });

  it('centers the pill on the measured tab X', () => {
    const centers = [40, 120, 280, 360];
    expect(pillTranslateX(centers, 0, 40)).toBe(20); // 40 - 20
    expect(pillTranslateX(centers, 2, 40)).toBe(260); // 280 - 20
  });

  it('returns null when the target center is missing', () => {
    expect(pillTranslateX([40, undefined, 280, 360], 1, 40)).toBeNull();
    expect(pillTranslateX([40], 3, 40)).toBeNull();
  });
});
