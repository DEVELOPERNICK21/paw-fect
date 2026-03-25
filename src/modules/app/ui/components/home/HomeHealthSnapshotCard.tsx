import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../../../shared/components/AppText';
import { Button } from '../../../../../shared/components/Button';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';
import type { Theme } from '../../../../../shared/hooks/useTheme';
import { fontSizes, lineHeights } from '../../../../../shared/theme/typography';
import { fontFamilies } from '../../../../../shared/theme/fonts';

export interface HomeHealthSnapshotCardProps {
  weightLine: string;
  activityLine: string;
  heartLine: string;
  onPressLogActivity: () => void;
  theme: Theme;
}

interface MetricRowProps {
  label: string;
  value: string;
  iconName: 'weight' | 'directions_walk' | 'monitor_heart';
  iconBg: string;
  iconFg: string;
  theme: Theme;
}

const MetricRow = React.memo(
  ({ label, value, iconName, iconBg, iconFg, theme }: MetricRowProps) => {
    const { colors, radius, spacing, textStyles, fontFamilies } = theme;

    return (
      <View style={[styles.metricRow, { gap: spacing.md }]}>
        <View
          style={[
            styles.iconTile,
            {
              borderRadius: radius.md,
              backgroundColor: iconBg,
              width: spacing['2xl'] + spacing.xs,
              height: spacing['2xl'] + spacing.xs,
            },
          ]}
        >
          <MaterialIcon name={iconName} size={22} color={iconFg} />
        </View>
        <AppText
          style={[
            textStyles.caption,
            {
              color: colors.text.secondary,
              flex: 1,
              fontFamily: fontFamilies.semibold,
            },
          ]}
        >
          {label}
        </AppText>
        <AppText
          style={[
            textStyles.subtitle,
            { color: colors.text.heading, fontFamily: fontFamilies.bold },
          ]}
        >
          {value}
        </AppText>
      </View>
    );
  },
);

MetricRow.displayName = 'MetricRow';

export const HomeHealthSnapshotCard: React.FC<HomeHealthSnapshotCardProps> =
  React.memo(
    ({ weightLine, activityLine, heartLine, onPressLogActivity, theme }) => {
      const { colors, radius, shadows, spacing } = theme;

      return (
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.brandTint5,
              borderRadius: radius.xl,
              borderColor: colors.brandTint12,
              padding: spacing.lg,
              gap: spacing.lg,
            },
            shadows.sm,
          ]}
        >
          <AppText
            style={[theme.textStyles.title, { color: colors.text.heading }]}
          >
            Health snapshot
          </AppText>
          <View style={{ gap: spacing.md }}>
            <MetricRow
              label="Weight"
              value={weightLine}
              iconName="weight"
              iconBg={colors.infoSurface}
              iconFg={colors.info}
              theme={theme}
            />
            <MetricRow
              label="Activity"
              value={activityLine}
              iconName="directions_walk"
              iconBg={colors.successSurface}
              iconFg={colors.success}
              theme={theme}
            />
            <MetricRow
              label="Heart rate"
              value={heartLine}
              iconName="monitor_heart"
              iconBg={colors.brandTint12}
              iconFg={colors.accent}
              theme={theme}
            />
          </View>
          <Button
            title="Log activity"
            onPress={onPressLogActivity}
            // variant="secondary"
            style={{
              width: '100%',
              borderRadius: radius.lg,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
            }}
            textStyle={{
              fontFamily: fontFamilies.bold,
              fontSize: fontSizes.md,
              lineHeight: lineHeights.md,
            }}
          />
        </View>
      );
    },
  );

HomeHealthSnapshotCard.displayName = 'HomeHealthSnapshotCard';

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconTile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
