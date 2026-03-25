export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  pill: 999,
  round: 9999,
} as const;

export type RadiusKey = keyof typeof radius;

