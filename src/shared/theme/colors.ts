export const colors = {
  primary: '#F28C28',
  primaryDark: '#D77411',
  primaryLight: '#FFD199',

  background: '#F7F7FA',
  surface: '#FFFFFF',

  text: {
    primary: '#1F2933',
    secondary: '#6B7280',
    muted: '#9CA3AF',
    inverse: '#FFFFFF',
  },

  border: '#E5E7EB',
  danger: '#EF4444',
  dangerDark: '#B91C1C',
  success: '#10B981',
  info: '#3B82F6',
  warning: '#F59E0B',

  shadow: 'rgba(15, 23, 42, 0.15)',
} as const;

export type AppColors = typeof colors;

