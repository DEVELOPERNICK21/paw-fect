import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Visual shell height (bar row + FAB lift) — must stay in sync with `PawTabBar`. */
export const TAB_BAR_VISUAL_HEIGHT = 92;

/**
 * Bottom inset below scroll content: matches `PawTabBar` shell (`TAB_BAR_VISUAL_HEIGHT` + safe bottom).
 */
export function useAppTabBarInset(): number {
  const { bottom } = useSafeAreaInsets();
  const bottomPad = Math.max(bottom, Platform.OS === 'ios' ? 6 : 4);
  return TAB_BAR_VISUAL_HEIGHT + bottomPad;
}
