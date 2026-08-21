import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { HomeDashboardWeekCareItem } from '../../../domain/models/HomeDashboardViewModel';
import { AppText } from '../../../../../shared/components/AppText';
import { Button } from '../../../../../shared/components/Button';
import type { Theme } from '../../../../../shared/hooks/useTheme';

export interface UpcomingSectionProps {
  items: HomeDashboardWeekCareItem[];
  loading: boolean;
  /** Primary empty-state action: Health tab (smart schedules + system nudges). */
  onPressOpenHealth: () => void;
  theme: Theme;
}

function kindLabel(item: HomeDashboardWeekCareItem): string {
  if (item.kind === 'vaccination') {
    return 'Vaccine';
  }
  if (item.kind === 'deworming') {
    return 'Deworm';
  }
  return 'Reminder';
}

export const UpcomingSection: React.FC<UpcomingSectionProps> = React.memo(
  ({ items, loading, onPressOpenHealth, theme }) => {
    const { colors, radius, spacing, textStyles, fontFamilies } = theme;

    return (
      <View style={{ gap: spacing.sm }}>
        <View style={styles.sectionHead}>
          <AppText
            accessibilityRole="header"
            style={[
              textStyles.subtitle,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
          >
            This week
          </AppText>
          {loading ? (
            <View
              style={[
                styles.skel,
                { backgroundColor: colors.surfaceAlt, borderRadius: radius.xs },
              ]}
            />
          ) : (
            <AppText
              style={[textStyles.metricCaption, { color: colors.text.secondary }]}
            >
              {items.length}
            </AppText>
          )}
        </View>

        {!loading && items.length === 0 ? (
          <View
            style={[
              styles.empty,
              {
                borderRadius: radius.sm,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surface,
                padding: spacing.md,
                gap: spacing.sm,
              },
            ]}
          >
            <AppText
              style={[textStyles.caption, { color: colors.text.secondary }]}
            >
              Nothing extra this week. Open health for vaccine and deworming
              dates.
            </AppText>
            <Button title="Open health schedule" onPress={onPressOpenHealth} />
          </View>
        ) : null}

        {!loading && items.length > 0 ? (
          <View
            style={[
              styles.list,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
                borderRadius: radius.sm,
              },
            ]}
          >
            {items.map((item, index) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${item.subtitle}`}
                onPress={onPressOpenHealth}
                style={[
                  styles.row,
                  {
                    minHeight: 44,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: colors.borderSubtle,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        index === 0 ? colors.accent : colors.border,
                    },
                  ]}
                />
                <View style={styles.rowCopy}>
                  <AppText
                    style={[
                      textStyles.caption,
                      {
                        color: colors.text.heading,
                        fontFamily: fontFamilies.medium,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </AppText>
                  <AppText
                    style={[
                      textStyles.footer,
                      { color: colors.text.secondary },
                    ]}
                    numberOfLines={1}
                  >
                    {kindLabel(item)} · {item.subtitle}
                  </AppText>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    );
  },
);

UpcomingSection.displayName = 'UpcomingSection';

const styles = StyleSheet.create({
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  skel: {
    width: 16,
    height: 10,
  },
  list: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  empty: {
    borderWidth: 1,
  },
});
