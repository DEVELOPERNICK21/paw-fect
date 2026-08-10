export type SideTabKey = 'home' | 'health' | 'notifications' | 'settings';
export type TabBarKey = SideTabKey | 'pets';

export const SIDE_TAB_ORDER: readonly SideTabKey[] = [
  'home',
  'health',
  'notifications',
  'settings',
] as const;

export function sideTabIndex(key: TabBarKey): number | null {
  const index = SIDE_TAB_ORDER.indexOf(key as SideTabKey);
  return index >= 0 ? index : null;
}

export function isSideTabActive(key: TabBarKey): boolean {
  return sideTabIndex(key) != null;
}

/**
 * Absolute `left`-equivalent for an indicator using `translateX` from x=0
 * when the pill's left edge should sit at `centerX - pillSize/2`.
 */
export function pillTranslateX(
  centersX: ReadonlyArray<number | undefined>,
  sideIndex: number,
  pillSize: number,
): number | null {
  const centerX = centersX[sideIndex];
  if (centerX == null || !Number.isFinite(centerX)) {
    return null;
  }
  return centerX - pillSize / 2;
}
