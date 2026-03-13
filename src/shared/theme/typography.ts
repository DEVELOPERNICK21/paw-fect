import type { TextStyle } from 'react-native';

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 30,
} as const;

export const fontWeights = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

export const textStyles = {
  title: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  } as TextStyle,
  subtitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
  } as TextStyle,
  body: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
  } as TextStyle,
  caption: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
  } as TextStyle,
} as const;

export type TextStyles = typeof textStyles;

