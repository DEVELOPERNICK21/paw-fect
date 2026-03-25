import { StyleSheet } from 'react-native';

import type { AppColors } from '../../../../shared/theme/colors';
import { spacing } from '../../../../shared/theme/spacing';
import { SPLASH_DECOR } from '../constants/splashLayout';

const decorRadius = SPLASH_DECOR.circleSize / 2;

export function createSplashScreenStyles(colors: AppColors) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundAlt,
    },
    main: {
      flex: 1,
      justifyContent: 'space-between',
      backgroundColor: colors.backgroundAlt,
    },
    topSection: {
      width: '100%',
      paddingTop: spacing.splashHeroTop,
      paddingHorizontal: spacing.lg,
      flex: 1,
      justifyContent: 'center',
    },
    bottomSection: {
      width: '100%',
      paddingBottom: spacing['4xl'],
    },
    decorTop: {
      position: 'absolute',
      right: -SPLASH_DECOR.edgeOverflow,
      top: -SPLASH_DECOR.edgeOverflow,
      width: SPLASH_DECOR.circleSize,
      height: SPLASH_DECOR.circleSize,
      borderRadius: decorRadius,
      backgroundColor: colors.brandTint5,
    },
    decorBottom: {
      position: 'absolute',
      left: -SPLASH_DECOR.edgeOverflow,
      bottom: -SPLASH_DECOR.edgeOverflow,
      width: SPLASH_DECOR.circleSize,
      height: SPLASH_DECOR.circleSize,
      borderRadius: decorRadius,
      backgroundColor: colors.brandTint10,
    },
  });
}

export type SplashScreenStyles = ReturnType<typeof createSplashScreenStyles>;
