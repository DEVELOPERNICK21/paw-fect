import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Skeleton } from '../../../../../shared/components/Skeleton';
import type { Theme } from '../../../../../shared/hooks/useTheme';

type HomeDashboardSkeletonProps = {
  theme: Theme;
};

export const HomeDashboardSkeleton: React.FC<HomeDashboardSkeletonProps> =
  React.memo(({ theme }) => {
    const { radius, spacing } = theme;

    return (
      <View
        style={[styles.wrap, { gap: spacing.xl }]}
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        accessibilityLabel="Loading home"
      >
        <Skeleton
          width="55%"
          height={28}
          borderRadius={radius.sm}
          style={{ backgroundColor: theme.colors.brandTint20 }}
          delayMs={0}
        />
        <Skeleton height={56} borderRadius={radius.pill} delayMs={80} />
        <View style={[styles.pets, { gap: spacing.md }]}>
          {[0, 1, 2].map(i => (
            <Skeleton
              key={i}
              width={80}
              height={80}
              borderRadius={radius.xl}
              delayMs={120 + i * 90}
            />
          ))}
        </View>
        <Skeleton height={148} borderRadius={radius.xl} delayMs={360} />
        <Skeleton height={220} borderRadius={radius.xl} delayMs={440} />
      </View>
    );
  });

HomeDashboardSkeleton.displayName = 'HomeDashboardSkeleton';

const styles = StyleSheet.create({
  wrap: {},
  pets: {
    flexDirection: 'row',
  },
});
