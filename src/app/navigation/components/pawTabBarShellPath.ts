export type PawTabBarShellParams = {
  width: number;
  height: number;
  cornerRadius: number;
  scoopRadius: number;
  scoopDepth: number;
};

/** Paw FAB diameter — shared with scoop depth math. */
export const FAB_SIZE = 58;
/** Height of the SVG scoop shell (excludes float gap + safe-area pad). */
export const BAR_HEIGHT = 64;
/** How much of the FAB visually sits above the bar's top edge, into the scoop. */
export const FAB_OVERHANG = 30;
/** Distance from the island bottom to the FAB layer bottom; FAB dips `FAB_SIZE - FAB_OVERHANG` into the scoop. */
export const FAB_BOTTOM_OFFSET = BAR_HEIGHT - (FAB_SIZE - FAB_OVERHANG);

export const DEFAULT_TAB_BAR_CORNER_RADIUS = 28;
export const DEFAULT_TAB_BAR_SCOOP_RADIUS = 38;
/** Depth of the top scoop cutout — must match how far the FAB dips below the bar top. */
export const DEFAULT_TAB_BAR_SCOOP_DEPTH = FAB_SIZE - FAB_OVERHANG;

/**
 * Closed SVG path for a floating tab bar with rounded ends and a center scoop.
 * Coordinate origin: top-left of the bar rect (0,0). Scoop dips downward (+y).
 */
export function buildPawTabBarShellPath(params: PawTabBarShellParams): string {
  const width = Math.max(params.width, 1);
  const height = Math.max(params.height, 1);
  const r = Math.min(
    Math.max(params.cornerRadius, 0),
    height / 2,
    width / 4,
  );
  const maxScoopR = Math.max(8, width / 2 - r - 8);
  const scoopR = Math.min(Math.max(params.scoopRadius, 8), maxScoopR);
  const scoopDepth = Math.min(
    Math.max(params.scoopDepth, 0),
    height - 8,
    scoopR,
  );

  const cx = width / 2;
  const scoopHalf = scoopR;
  const leftScoop = cx - scoopHalf;
  const rightScoop = cx + scoopHalf;

  // Top edge with center scoop (cubic bezier dip).
  // Start mid-left on top after left corner arc conceptually via M at top-left + r.
  const d = [
    `M ${r} 0`,
    `L ${leftScoop} 0`,
    // Scoop: down into cradle and back up
    `C ${leftScoop + scoopHalf * 0.35} 0 ${cx - scoopHalf * 0.55} ${scoopDepth} ${cx} ${scoopDepth}`,
    `C ${cx + scoopHalf * 0.55} ${scoopDepth} ${rightScoop - scoopHalf * 0.35} 0 ${rightScoop} 0`,
    `L ${width - r} 0`,
    `A ${r} ${r} 0 0 1 ${width} ${r}`,
    `L ${width} ${height - r}`,
    `A ${r} ${r} 0 0 1 ${width - r} ${height}`,
    `L ${r} ${height}`,
    `A ${r} ${r} 0 0 1 0 ${height - r}`,
    `L 0 ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    'Z',
  ].join(' ');

  return d;
}
