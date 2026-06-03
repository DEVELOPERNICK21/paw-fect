import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import type { HomeDashboardWeekCareItem } from '../../../domain/models/HomeDashboardViewModel';
import { AppText } from '../../../../../shared/components/AppText';
import { Button } from '../../../../../shared/components/Button';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';
import type { IconName } from '../../../../../shared/components/MaterialIcon';
import type { Theme } from '../../../../../shared/hooks/useTheme';

import { reminderTypeIcon } from '../../../../../shared/utils/reminderTypeIcon';

export interface UpcomingSectionProps {
  items: HomeDashboardWeekCareItem[];
  loading: boolean;
  /** Primary empty-state action: Health tab (smart schedules + system nudges). */
  onPressOpenHealth: () => void;
  theme: Theme;
}

function iconForWeekItem(item: HomeDashboardWeekCareItem): IconName {
  if (item.kind === 'vaccination') {
    return 'vaccines';
  }
  if (item.kind === 'deworming') {
    return 'pill';
  }
  return reminderTypeIcon(item.reminderType ?? 'other');
}

function tagLabel(item: HomeDashboardWeekCareItem): string {
  if (item.kind === 'vaccination') {
    return 'Vaccine';
  }
  if (item.kind === 'deworming') {
    return 'Deworm';
  }
  return 'Reminder';
}

type UpcomingRowProps = {
  item: HomeDashboardWeekCareItem;
  theme: Theme;
  accent: boolean;
};

const UpcomingCard = React.memo(({ item, theme, accent }: UpcomingRowProps) => {
  const { colors, radius, spacing, textStyles, fontFamilies } = theme;
  const iconName = iconForWeekItem(item);

  const surface = accent ? colors.brandTint10 : colors.surfaceAlt;
  const border = accent ? colors.brandTint12 : colors.borderSubtle;
  const iconBg = accent ? colors.accent : colors.borderSubtle;
  const iconFg = accent ? colors.text.inverse : colors.text.body;

  return (
    <View
      style={[
        styles.card,
        {
          width: 200,
          borderRadius: radius.lg,
          backgroundColor: surface,
          borderColor: border,
          padding: spacing.md,
          gap: spacing.md,
          borderWidth: 1,
        },
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          gap: spacing.md,
          alignItems: 'flex-start',
        }}
      >
        <View
          style={[
            styles.iconTile,
            {
              borderRadius: radius.md,
              backgroundColor: iconBg,
              width: spacing['2xl'],
              height: spacing['2xl'],
            },
          ]}
        >
          <MaterialIcon name={iconName} size={22} color={iconFg} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
          <AppText
            style={[
              textStyles.caption,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
            numberOfLines={2}
          >
            {item.title}
          </AppText>
          <AppText
            style={[textStyles.footer, { color: colors.text.secondary }]}
            numberOfLines={2}
          >
            {item.subtitle}
          </AppText>
          <View
            style={[
              styles.tag,
              {
                alignSelf: 'flex-start',
                backgroundColor: colors.brandTint10,
                borderRadius: radius.xs,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                marginTop: spacing.xs,
              },
            ]}
          >
            <AppText
              style={[
                textStyles.footer,
                { color: colors.accent, fontFamily: fontFamilies.bold },
              ]}
            >
              {tagLabel(item)}
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
});

UpcomingCard.displayName = 'UpcomingCard';

export const UpcomingSection: React.FC<UpcomingSectionProps> = React.memo(
  ({ items, loading, onPressOpenHealth, theme }) => {
    const { colors, spacing, textStyles } = theme;

    return (
      <View style={{ gap: spacing.md }}>
        <AppText style={[textStyles.title, { color: colors.text.heading }]}>
          This week
        </AppText>
        <AppText
          style={[
            textStyles.caption,
            { color: colors.text.secondary, marginTop: -spacing.sm },
          ]}
        >
          Next 7 days: vaccines, deworming, and any custom reminders
        </AppText>

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
              Nothing extra on the calendar this week. Vaccine and deworming alerts
              still come from your Health schedule and notifications.
            </AppText>
            <Button title="Open health schedule" onPress={onPressOpenHealth} />
          </View>
        ) : null}

        {!loading && items.length > 0 ? (
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: spacing.md,
              paddingRight: spacing.xl,
            }}
          >
            {items.map((item, index) => (
              <UpcomingCard
                key={item.id}
                item={item}
                theme={theme}
                accent={index === 0}
              />
            ))}
          </ScrollView>
        ) : null}
      </View>
    );
  },
);

UpcomingSection.displayName = 'UpcomingSection';

const styles = StyleSheet.create({
  card: {},
  iconTile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {},
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    borderWidth: 1,
    alignItems: 'stretch',
  },
});
