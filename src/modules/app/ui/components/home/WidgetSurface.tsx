import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import type { Theme } from '../../../../../shared/hooks/useTheme';

type WidgetSurfaceProps = {
  theme: Theme;
  children: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Dense dashboard shell: 1px border over shadow, 8px radius, tight padding.
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
