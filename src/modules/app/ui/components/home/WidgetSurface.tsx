import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import type { Theme } from '../../../../../shared/hooks/useTheme';

type WidgetSurfaceProps = {
  theme: Theme;
  children: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Clean white widget shell (inspired by launcher-style cards): rounded, soft border, elevation.
 */
export function WidgetSurface({
  theme,
  children,
  style,
}: WidgetSurfaceProps): React.ReactElement {
  const { colors, radius, spacing, shadows } = theme;

  return (
    <View
      style={[
        styles.outer,
        {
          borderRadius: radius['2xl'],
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          padding: spacing.lg,
          ...shadows.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {},
});
