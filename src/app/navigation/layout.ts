import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BAR_HEIGHT, FAB_OVERHANG } from './components/pawTabBarShellPath';

/** Horizontal inset of the floating island from screen edges. */
export const TAB_BAR_HORIZONTAL_INSET = 16;

/** Gap between safe-area bottom and the floating island. */
export const TAB_BAR_FLOAT_GAP = 8;

/** Extra space above the FAB so scroll content does not tuck under the paw. */
const TAB_BAR_CLEARANCE = 16;

/**
 * Visual chrome height above the safe-area pad: floating bar + FAB overhang + float gap.
 * Must stay in sync with `PawTabBar` geometry.
 */
export const TAB_BAR_VISUAL_HEIGHT =
  TAB_BAR_FLOAT_GAP + BAR_HEIGHT + FAB_OVERHANG + TAB_BAR_CLEARANCE;

/**
 * Bottom inset below scroll content: matches floating `PawTabBar`
 * (`TAB_BAR_VISUAL_HEIGHT` + safe bottom).
 */
export function useAppTabBarInset(): number {
  const { bottom } = useSafeAreaInsets();
  const bottomPad = Math.max(bottom, Platform.OS === 'ios' ? 6 : 4);
  return TAB_BAR_VISUAL_HEIGHT + bottomPad;
}
