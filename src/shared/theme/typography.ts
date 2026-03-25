import type { TextStyle } from 'react-native';
import { fontFamilies } from './fonts';

export const fontSizes = {
  xxs: 10,
  xs: 12,
  sm: 13,
  lead: 14,
  md: 15,
  base: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 38,
} as const;

export const fontWeights = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  extrabold: '800' as TextStyle['fontWeight'],
};

export const lineHeights = {
  xxs: 13,
  xs: 16,
  sm: 18,
  md: 20,
  base: 22,
  lg: 26,
  xl: 28,
  '2xl': 36,
  '3xl': 48,
} as const;

export const textStyles = {
  display: {
    fontFamily: fontFamilies.extrabold,
    fontSize: fontSizes['3xl'],
    lineHeight: lineHeights['3xl'],
    letterSpacing: -1.2,
  } as TextStyle,
  title: {
    fontFamily: fontFamilies.extrabold,
    fontSize: fontSizes.lg,
  } as TextStyle,
  subtitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.md,
  } as TextStyle,
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md,
  } as TextStyle,
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
  } as TextStyle,
  marketingLead: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.lead,
    lineHeight: lineHeights.lg,
  } as TextStyle,
  fieldLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.lead,
    lineHeight: lineHeights.sm,
  } as TextStyle,
  inputLarge: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.lg,
  } as TextStyle,
  control: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
  } as TextStyle,
  chevron: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lead,
    lineHeight: lineHeights.md,
  } as TextStyle,
  primaryCta: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    letterSpacing: 0.1,
  } as TextStyle,
  overline: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xxs,
    lineHeight: lineHeights.xxs,
    letterSpacing: 2,
  } as TextStyle,
  footer: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
  } as TextStyle,
  footerLink: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
  } as TextStyle,
  socialGlyph: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg,
  } as TextStyle,
  socialLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.lead,
  } as TextStyle,
  splashBrandTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 33,
    lineHeight: 40,
    letterSpacing: -0.6,
    opacity: 0.82,
    textAlign: 'center',
  } as TextStyle,
  splashBrandSubtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.xl,
    letterSpacing: 0.45,
    textAlign: 'center',
  } as TextStyle,
  splashProgressLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
  } as TextStyle,
  splashProgressValue: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
  } as TextStyle,
  splashVersion: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  } as TextStyle,
} as const;

export type TextStyles = typeof textStyles;
