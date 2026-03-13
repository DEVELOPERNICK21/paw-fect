import type { ViewStyle } from 'react-native';
import { Platform } from 'react-native';
import { colors } from './colors';

const baseShadow: ViewStyle = {
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.18,
  shadowRadius: 4,
};

export const shadows = {
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

export type ShadowKey = keyof typeof shadows;

