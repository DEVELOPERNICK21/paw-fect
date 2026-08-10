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
/** Horizontal half-width budget for the notch (wider = softer merge around FAB). */
export const DEFAULT_TAB_BAR_SCOOP_RADIUS = 44;
/** Depth of the top scoop cutout — must match how far the FAB dips below the bar top. */
export const DEFAULT_TAB_BAR_SCOOP_DEPTH = FAB_SIZE - FAB_OVERHANG;

/** Air gap between FAB edge and the circular cradle path. */
const CRADLE_GAP = 6;

/**
 * Horizontal gap reserved in the icon row for the scoop + FAB.
 * Slightly wider than the cradle opening so side icons don't crowd the notch.
 */
export function getTabBarFabGapWidth(
  scoopRadius: number = DEFAULT_TAB_BAR_SCOOP_RADIUS,
  scoopDepth: number = DEFAULT_TAB_BAR_SCOOP_DEPTH,
): number {
  const arcR = Math.min(scoopRadius + CRADLE_GAP, scoopDepth + CRADLE_GAP + 4);
  const circleCy = scoopDepth - arcR;
  const chordUnder = arcR * arcR - circleCy * circleCy;
  const halfChord =
    chordUnder > 0 ? Math.sqrt(chordUnder) : Math.max(scoopRadius * 0.85, 8);
  return Math.ceil(halfChord * 2 + 28);
}

/**
 * Closed SVG path for a floating tab bar with rounded ends and a center scoop.
 * Coordinate origin: top-left of the bar rect (0,0). Scoop dips downward (+y).
 *
 * Scoop uses a circular cradle (slightly larger than the FAB) plus short cubic
 * shoulders so the flat top melts into the cutout instead of meeting at a kink.
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
  // Cradle radius: FAB half-size + air gap so background shows through the merge.
  const cradleGap = CRADLE_GAP;
  const arcR = Math.min(scoopR + cradleGap, scoopDepth + cradleGap + 4);
  // Circle centered so its lowest point sits at scoopDepth (cradles the FAB).
  const circleCy = scoopDepth - arcR;
  const chordUnder = arcR * arcR - circleCy * circleCy;
  const halfChord =
    chordUnder > 0 ? Math.sqrt(chordUnder) : Math.max(scoopR * 0.85, 8);
  const leftArc = cx - halfChord;
  const rightArc = cx + halfChord;

  // Soft shoulder: ease off the flat top before joining the circular cradle.
  const shoulder = Math.min(16, halfChord * 0.4);
  const leftShoulder = Math.max(r, leftArc - shoulder);
  const rightShoulder = Math.min(width - r, rightArc + shoulder);
  const arcJoinY = Math.max(0, -circleCy * 0.12);

  const d = [
    `M ${r} 0`,
    `L ${leftShoulder} 0`,
    // Left shoulder: horizontal leave → settle onto the arc start
    `C ${leftShoulder + shoulder * 0.65} 0 ${leftArc - shoulder * 0.2} ${
      scoopDepth * 0.12
    } ${leftArc} ${arcJoinY}`,
    // Large clockwise arc under the FAB (SVG y-down: sweep=1 dips into +y)
    `A ${arcR} ${arcR} 0 1 1 ${rightArc} ${arcJoinY}`,
    // Right shoulder: leave arc → flatten back onto the top edge
    `C ${rightArc + shoulder * 0.2} ${scoopDepth * 0.12} ${
      rightShoulder - shoulder * 0.65
    } 0 ${rightShoulder} 0`,
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
