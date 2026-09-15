import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import type { Theme } from '../hooks/useTheme';
import { useTheme } from '../hooks/useTheme';

type WidgetSurfaceProps = {
  theme?: Theme;
  children: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Dense dashboard shell used on Home and health care cards:
 * 1px border, soft shadow, sm radius, md padding.
 */
export function WidgetSurface({
  theme: themeProp,
  children,
  style,
}: WidgetSurfaceProps): React.ReactElement {
  const hookTheme = useTheme();
  const theme = themeProp ?? hookTheme;
  const { colors, radius, spacing, shadows } = theme;

  return (
    <View
      style={[
        styles.outer,
        {
          borderRadius: radius.sm,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          padding: spacing.md,
          ...shadows.sm,
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
