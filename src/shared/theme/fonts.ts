/**
 * Plus Jakarta Sans — static TTFs in `src/shared/assets/fonts/`.
 * Use PostScript names (matches iOS registration; Android bundled fonts).
 */
export const fontFamilies = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semibold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  extrabold: 'PlusJakartaSans-ExtraBold',
} as const;

export type FontFamily = keyof typeof fontFamilies;
