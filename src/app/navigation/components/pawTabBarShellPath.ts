export type PawTabBarShellParams = {
  width: number;
  height: number;
  cornerRadius: number;
  scoopRadius: number;
  scoopDepth: number;
};

/** Paw FAB diameter — shared with scoop depth math. */
export const FAB_SIZE = 56;
/** Height of the SVG scoop shell (excludes float gap + safe-area pad). */
export const BAR_HEIGHT = 60;
/** How much of the FAB visually sits above the bar's top edge, into the scoop. */
export const FAB_OVERHANG = 26;
/** Distance from the island bottom to the FAB layer bottom; FAB dips `FAB_SIZE - FAB_OVERHANG` into the scoop. */
export const FAB_BOTTOM_OFFSET = BAR_HEIGHT - (FAB_SIZE - FAB_OVERHANG);

export const DEFAULT_TAB_BAR_CORNER_RADIUS = 30;
/** Horizontal half-width of the notch opening. */
export const DEFAULT_TAB_BAR_SCOOP_RADIUS = 40;
/** Depth of the top scoop cutout — must match how far the FAB dips below the bar top. */
export const DEFAULT_TAB_BAR_SCOOP_DEPTH = FAB_SIZE - FAB_OVERHANG;

/**
 * Horizontal gap reserved in the icon row for the scoop + FAB.
 * Wider than the notch so side icons clear the cradle.
 */
export function getTabBarFabGapWidth(
  scoopRadius: number = DEFAULT_TAB_BAR_SCOOP_RADIUS,
): number {
  return Math.ceil(scoopRadius * 2 + 20);
}

/**
 * Closed SVG path for a floating tab bar with rounded ends and a center scoop.
 * Coordinate origin: top-left of the bar rect (0,0). Scoop dips downward (+y).
 *
 * Uses a simple dual-cubic valley (no SVG arcs) so the notch reliably cuts into
 * the fill instead of inverting.
 */
export function buildPawTabBarShellPath(params: PawTabBarShellParams): string {
  const width = Math.max(params.width, 1);
  const height = Math.max(params.height, 1);
  const r = Math.min(
    Math.max(params.cornerRadius, 0),
    height / 2,
    width / 4,
  );
  const half = Math.min(
    Math.max(params.scoopRadius, 8),
    Math.max(8, width / 2 - r - 12),
  );
  const depth = Math.min(
    Math.max(params.scoopDepth, 0),
    height - 10,
    half,
  );

  const cx = width / 2;
  const left = cx - half;
  const right = cx + half;

  // Smooth U: horizontal leave → cradle floor → horizontal return (C1 at top joins).
  const d = [
    `M ${r} 0`,
    `L ${left} 0`,
    `C ${left + half * 0.42} 0 ${cx - half * 0.38} ${depth} ${cx} ${depth}`,
    `C ${cx + half * 0.38} ${depth} ${right - half * 0.42} 0 ${right} 0`,
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
