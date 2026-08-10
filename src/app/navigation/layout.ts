import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Horizontal inset of the floating island from screen edges. */
export const TAB_BAR_HORIZONTAL_INSET = 16;

/** Gap between safe-area bottom and the floating island. */
export const TAB_BAR_FLOAT_GAP = 8;

/**
 * Visual chrome height above the safe-area pad: floating bar + FAB overhang + float gap.
 * Must stay in sync with `PawTabBar` geometry.
 * Budget: FLOAT_GAP(8) + BAR_HEIGHT(64) + FAB_OVERHANG(30) + content clearance(24) = 126.
 */
export const TAB_BAR_VISUAL_HEIGHT = 126;

/**
 * Bottom inset below scroll content: matches floating `PawTabBar`
 * (`TAB_BAR_VISUAL_HEIGHT` + safe bottom).
 */
export function useAppTabBarInset(): number {
  const { bottom } = useSafeAreaInsets();
  const bottomPad = Math.max(bottom, Platform.OS === 'ios' ? 6 : 4);
  return TAB_BAR_VISUAL_HEIGHT + bottomPad;
}
