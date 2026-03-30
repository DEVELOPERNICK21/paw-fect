import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { HomeDashboardTodayCareItem } from '../../../domain/models/HomeDashboardViewModel';
import { AppText } from '../../../../../shared/components/AppText';
import { Button } from '../../../../../shared/components/Button';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';
import type { Theme } from '../../../../../shared/hooks/useTheme';
import { spacing as spacingTokens } from '../../../../../shared/theme/spacing';

import { reminderTypeIcon } from '../../../../../shared/utils/reminderTypeIcon';
import { radius } from '../../../../../shared/theme/radius';
import { fontSizes, lineHeights } from '../../../../../shared/theme/typography';

export interface TodayCareSectionProps {
  items: HomeDashboardTodayCareItem[];
  loading: boolean;
  onPressAddReminder: () => void;
  onPressViewSchedule: () => void;
  theme: Theme;
}

function iconShellColors(
  theme: Theme,
  index: number,
): { bg: string; fg: string } {
  const { colors } = theme;
  const kind = index % 3;
  if (kind === 0) {
    return { bg: colors.infoSurface, fg: colors.info };
  }
  if (kind === 1) {
    return { bg: colors.brandTint12, fg: colors.accent };
  }
  return { bg: colors.successSurface, fg: colors.success };
}

const CareRow = React.memo(
  ({
    item,
    theme,
    index,
  }: {
    item: HomeDashboardTodayCareItem;
    theme: Theme;
    index: number;
  }) => {
    const { colors, radius, shadows, spacing, textStyles, fontFamilies } =
      theme;
    const { reminder, showCompletedCheck } = item;
    const shell = iconShellColors(theme, index);
    const iconName = reminderTypeIcon(reminder.type);
    const subtitle =
      reminder.time.trim().length > 0 ? reminder.time : 'All day';

    return (
      <View
        style={[
          styles.row,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderColor: showCompletedCheck
              ? colors.brandTint20
              : colors.brandTint10,
            padding: spacing.md,
            gap: spacing.md,
          },
          shadows.sm,
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            {
              borderRadius: radius.md,
              backgroundColor: shell.bg,
              width: spacing['2xl'] + spacing.sm,
              height: spacing['2xl'] + spacing.sm,
            },
          ]}
        >
          <MaterialIcon name={iconName} size={22} color={shell.fg} />
        </View>

        <View style={styles.rowText}>
          <AppText
            style={[
              textStyles.caption,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
            numberOfLines={1}
          >
            {reminder.title}
          </AppText>
          <AppText
            style={[textStyles.footer, { color: colors.text.secondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </AppText>
        </View>

        <View style={[styles.status, { width: spacing['2xl'] }]}>
          {showCompletedCheck ? (
            <MaterialIcon
              name="check_circle"
              size={24}
              color={colors.primary}
            />
          ) : (
            <View
              style={[
                styles.pendingRing,
                {
                  borderColor: colors.border,
                  width: spacing.lg + spacing.xs,
                  height: spacing.lg + spacing.xs,
                  borderRadius: radius.round,
                },
              ]}
            />
          )}
        </View>
      </View>
    );
  },
);

CareRow.displayName = 'CareRow';

export const TodayCareSection: React.FC<TodayCareSectionProps> = React.memo(
  ({ items, loading, onPressAddReminder, onPressViewSchedule, theme }) => {
    const { colors, spacing, textStyles, fontFamilies } = theme;

    return (
      <View style={{ gap: spacing.md }}>
        <View style={styles.sectionHead}>
          <AppText style={[textStyles.title, { color: colors.text.heading }]}>
            Today&apos;s care
          </AppText>
          <Pressable
            onPress={onPressViewSchedule}
            accessibilityRole="button"
            hitSlop={8}
          >
            <AppText
              style={[
                textStyles.caption,
                { color: colors.primary, fontFamily: fontFamilies.semibold },
              ]}
            >
              View schedule
            </AppText>
          </Pressable>
        </View>

        {loading ? (
          <View style={[styles.loader, { paddingVertical: spacing.lg }]}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}

        {!loading && items.length === 0 ? (
          <View
            style={[
              styles.empty,
              {
                borderRadius: theme.radius.lg,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceAlt,
                padding: spacing.xl,
                gap: spacing.md,
              },
            ]}
          >
            <AppText
              style={[
                textStyles.body,
                { color: colors.text.secondary, textAlign: 'center' },
              ]}
            >
              Nothing scheduled for today. Add a reminder to keep care on track.
            </AppText>
            <Button
              title="Add reminder"
              onPress={onPressAddReminder}
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
        ) : null}

        {!loading && items.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            {items.map((item, index) => (
              <CareRow
                key={item.reminder.id}
                item={item}
                theme={theme}
                index={index}
              />
            ))}
          </View>
        ) : null}
      </View>
    );
  },
);

TodayCareSection.displayName = 'TodayCareSection';

const styles = StyleSheet.create({
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacingTokens.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: spacingTokens.xxs,
  },
  status: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingRing: {
    borderWidth: 2,
  },
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    borderWidth: 1,
    alignItems: 'stretch',
  },
});
