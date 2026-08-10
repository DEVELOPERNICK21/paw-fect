import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../../../../shared/hooks/useTheme';

type Props = {
  /** Visual density; hero steps use full, form steps use compact. */
  variant?: 'hero' | 'compact';
};

/**
 * Soft accent wash using Views only (no SVG) so it cannot cover step copy
 * on Android / Fabric. Rendered behind content; non-interactive.
 */
export const OnboardingBlobBackdrop: React.FC<Props> = ({
  variant = 'hero',
}) => {
  const { colors, isDarkMode } = useTheme();
  const size = variant === 'compact' ? 160 : 220;
  const opacity = isDarkMode ? 0.18 : 0.28;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          position: 'absolute',
          top: -size * 0.4,
          right: -size * 0.45,
          width: size,
          height: size,
          opacity,
          pointerEvents: 'none',
        },
        blobPrimary: {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.accent,
        },
        blobSecondary: {
          position: 'absolute',
          top: size * 0.3,
          left: size * 0.15,
          width: size * 0.55,
          height: size * 0.55,
          borderRadius: (size * 0.55) / 2,
          backgroundColor: colors.brandTint20,
        },
      }),
    [colors.accent, colors.brandTint20, opacity, size],
  );

  return (
    <View
      style={styles.wrap}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.blobPrimary} />
      <View style={styles.blobSecondary} />
    </View>
  );
};
