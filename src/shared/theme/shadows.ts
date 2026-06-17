import type { ViewStyle } from 'react-native';
import { Platform } from 'react-native';
import { darkColors, lightColors, type AppColors } from './colors';

const createBaseShadow = (colors: AppColors): ViewStyle => ({
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.18,
  shadowRadius: 4,
});

const calculateShadows = (colors: AppColors) => {
  const baseShadow = createBaseShadow(colors);
  return {
    none: {} as ViewStyle,
    sm: {
      ...baseShadow,
      elevation: Platform.OS === 'android' ? 2 : 0,
    } as ViewStyle,
    md: {
      ...baseShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: Platform.OS === 'android' ? 4 : 0,
    } as ViewStyle,
    lg: {
      ...baseShadow,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      elevation: Platform.OS === 'android' ? 8 : 0,
    } as ViewStyle,
  } as const;
};

const lightShadows = calculateShadows(lightColors);
const darkShadows = calculateShadows(darkColors);

/**
 * Returns a stable shadow configuration for the given colors.
 * Memoized by theme to avoid repeated object allocations.
 */
export const getShadows = (colors: AppColors) => {
  return colors === darkColors ? darkShadows : lightShadows;
};

export const shadows = lightShadows;

export type ShadowKey = keyof typeof shadows;
