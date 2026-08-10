export type ThemeMode = 'light' | 'dark';

export const lightColors = {
  primary: '#F28C28',
  primaryDark: '#D77411',
  primaryLight: '#FFD199',
  accent: '#EE8C2B',

  background: '#F7F7FA',
  backgroundAlt: '#F8F7F6',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  elevated: '#FFFFFF',
  tabBarBackground: 'rgba(248, 247, 246, 0.96)',
  /** Floating tab island frosted fill (used with backdrop blur). */
  tabBarGlass: 'rgba(255, 255, 255, 0.72)',
  /** Light rim on the glass tab island. */
  tabBarGlassBorder: 'rgba(255, 255, 255, 0.65)',

  text: {
    primary: '#1F2933',
    heading: '#0F172A',
    body: '#475569',
    secondary: '#6B7280',
    muted: '#9CA3AF',
    subdued: '#94A3B8',
    inverse: '#FFFFFF',
  },

  border: '#E5E7EB',
  borderSubtle: '#E2E8F0',
  input: {
    placeholder: '#CBD5E1',
  },
  danger: '#EF4444',
  dangerDark: '#B91C1C',
  success: '#10B981',
  /** Soft fill behind success icons (e.g. care task done) */
  successSurface: '#D1FAE5',
  info: '#3B82F6',
  /** Soft fill behind info-style care icons */
  infoSurface: '#DBEAFE',
  warning: '#F59E0B',

  shadow: 'rgba(15, 23, 42, 0.15)',
  overlay: 'rgba(15, 23, 42, 0.4)',

  /** Translucent accent fills (splash, brand glows) */
  brandTint5: 'rgba(238, 140, 43, 0.05)',
  brandTint10: 'rgba(238, 140, 43, 0.1)',
  brandTint12: 'rgba(238, 140, 43, 0.12)',
  brandTint20: 'rgba(238, 140, 43, 0.2)',
  splashMediaOverlay: 'rgba(248, 247, 246, 0.15)',
} as const;

export type AppColors = typeof lightColors;

export const darkColors = {
  primary: '#F4A64F',
  primaryDark: '#E48623',
  primaryLight: '#7D4B12',
  accent: '#F4A64F',

  background: '#0E141D',
  backgroundAlt: '#131B26',
  surface: '#1B2634',
  surfaceAlt: '#243244',
  elevated: '#202D3E',
  tabBarBackground: 'rgba(19, 27, 38, 0.96)',
  tabBarGlass: 'rgba(19, 27, 38, 0.78)',
  tabBarGlassBorder: 'rgba(255, 255, 255, 0.2)',

  text: {
    primary: '#E5E7EB',
    heading: '#F8FAFC',
    body: '#CBD5E1',
    secondary: '#94A3B8',
    muted: '#64748B',
    subdued: '#94A3B8',
    inverse: '#0F172A',
  },

  border: '#2B3A4D',
  borderSubtle: '#334155',
  input: {
    placeholder: '#64748B',
  },
  danger: '#F87171',
  dangerDark: '#DC2626',
  success: '#34D399',
  successSurface: 'rgba(52, 211, 153, 0.16)',
  info: '#60A5FA',
  infoSurface: 'rgba(96, 165, 250, 0.16)',
  warning: '#FBBF24',

  shadow: 'rgba(2, 6, 23, 0.55)',
  overlay: 'rgba(2, 6, 23, 0.6)',

  brandTint5: 'rgba(244, 166, 79, 0.08)',
  brandTint10: 'rgba(244, 166, 79, 0.15)',
  brandTint12: 'rgba(244, 166, 79, 0.2)',
  brandTint20: 'rgba(244, 166, 79, 0.3)',
  splashMediaOverlay: 'rgba(19, 27, 38, 0.4)',
} as const as unknown as AppColors;

export const getColorsForMode = (mode: ThemeMode): AppColors =>
  mode === 'dark' ? darkColors : lightColors;

// Backward-compatible default tokens for modules not yet theme-resolved.
export const colors = lightColors;
