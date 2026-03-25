/** Splash-specific layout (not general spacing scale). */
export const SPLASH_DECOR = {
  circleSize: 256,
  edgeOverflow: 96,
} as const;

export const SPLASH_LOGO = {
  size: 182,
  pulseDiameter: 188,
  pulseBorderRadius: 44,
  pulseTop: 1,
} as const;

export const SPLASH_PROGRESS_TRACK_HEIGHT = 5 as const;

export const SPLASH_VISUAL_CARD = {
  height: 244.5,
  /** Card padding; inner image radius = outer xl − this */
  innerRadiusInset: 1,
} as const;
