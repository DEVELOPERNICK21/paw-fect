import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  StyleSheet,
  View,
} from 'react-native';

import type { HomeDashboardUpcomingItem } from '../../../domain/models/HomeDashboardViewModel';
import { AppText } from '../../../../../shared/components/AppText';
import { Button } from '../../../../../shared/components/Button';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';
import type { Theme } from '../../../../../shared/hooks/useTheme';

import { reminderTypeIcon } from '../../../../../shared/utils/reminderTypeIcon';
import { spacing } from '../../../../../shared/theme/spacing';
import { radius } from '../../../../../shared/theme/radius';

export interface UpcomingSectionProps {
  items: HomeDashboardUpcomingItem[];
  loading: boolean;
  onPressAddReminder: () => void;
  theme: Theme;
}

type UpcomingRowProps = {
  item: HomeDashboardUpcomingItem;
  theme: Theme;
  accent: boolean;
};

const UpcomingCard = React.memo(({ item, theme, accent }: UpcomingRowProps) => {
  const { colors, radius, spacing, textStyles, fontFamilies } = theme;
  const { reminder, milestoneSubtitle } = item;
  const iconName = reminderTypeIcon(reminder.type);

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
            {reminder.title}
          </AppText>
          <AppText
            style={[textStyles.footer, { color: colors.text.secondary }]}
            numberOfLines={2}
          >
            {milestoneSubtitle}
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
              Scheduled
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
});

UpcomingCard.displayName = 'UpcomingCard';

export const UpcomingSection: React.FC<UpcomingSectionProps> = React.memo(
  ({ items, loading, onPressAddReminder, theme }) => {
    const { colors, spacing, textStyles } = theme;

    const renderItem: ListRenderItem<HomeDashboardUpcomingItem> = useCallback(
      ({ item, index }) => (
        <UpcomingCard item={item} theme={theme} accent={index === 0} />
      ),
      [theme],
    );

    const keyExtractor = useCallback(
      (item: HomeDashboardUpcomingItem) => item.reminder.id,
      [],
    );

    return (
      <View style={{ gap: spacing.md }}>
        <AppText style={[textStyles.title, { color: colors.text.heading }]}>
          Upcoming milestones
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
              No upcoming reminders yet. Plan the next vet visit or grooming
              session.
            </AppText>
            <Button
              title="Add reminder"
              onPress={onPressAddReminder}
              // style={styles.emptyButton}
            />
          </View>
        ) : null}

        {!loading && items.length > 0 ? (
          <FlatList
            horizontal
            data={items}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              columnGap: spacing.md,
              paddingRight: spacing.xl,
            }}
          />
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
  emptyButton: {
    width: '100%',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
