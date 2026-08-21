import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { Theme } from '../../../../../shared/hooks/useTheme';

type HomeDashboardSkeletonProps = {
  theme: Theme;
};

export const HomeDashboardSkeleton: React.FC<HomeDashboardSkeletonProps> =
  React.memo(({ theme }) => {
    const { colors, radius, spacing } = theme;

    return (
      <View
        style={[styles.wrap, { gap: spacing.xl }]}
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        accessibilityLabel="Loading home"
      >
        <View
          style={[
            styles.title,
            { backgroundColor: colors.brandTint20, borderRadius: radius.sm },
          ]}
        />
        <View
          style={[
            styles.jump,
            {
              backgroundColor: colors.surfaceAlt,
              borderRadius: radius.pill,
            },
          ]}
        />
        <View style={[styles.pets, { gap: spacing.md }]}>
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={[
                styles.petTile,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: radius.xl,
                },
              ]}
            />
          ))}
        </View>
        <View
          style={[
            styles.task,
            {
              backgroundColor: colors.surfaceAlt,
              borderRadius: radius.xl,
            },
          ]}
        />
        <View
          style={[
            styles.health,
            {
              backgroundColor: colors.surfaceAlt,
              borderRadius: radius.xl,
            },
          ]}
        />
      </View>
    );
  });

HomeDashboardSkeleton.displayName = 'HomeDashboardSkeleton';

const styles = StyleSheet.create({
  wrap: {},
  title: {
    width: '55%',
    height: 28,
  },
  jump: {
    height: 56,
  },
  pets: {
    flexDirection: 'row',
  },
  petTile: {
    width: 80,
    height: 80,
  },
  task: {
    height: 148,
  },
  health: {
    height: 220,
  },
});
