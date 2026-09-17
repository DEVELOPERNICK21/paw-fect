import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { HomeDashboardTodayCareItem } from '../../../../app/domain/models/HomeDashboardViewModel';
import { AppText } from '../../../../../shared/components/AppText';
import { useTheme } from '../../../../../shared/hooks/useTheme';
import { PetProfileTodayCareRow } from './PetProfileTodayCareRow';

export interface PetProfileTodayCareSectionProps {
  items: HomeDashboardTodayCareItem[];
  loading: boolean;
  /** Opens Wellness hub (canonical daily care surface). */
  onPressOpenHealthSchedule: () => void;
}

export const PetProfileTodayCareSection: React.FC<PetProfileTodayCareSectionProps> =
  React.memo(({ items, loading, onPressOpenHealthSchedule }) => {
    const theme = useTheme();
    const { colors, spacing, textStyles, fontFamilies } = theme;

    return (
      <View style={styles.wrap}>
        <View style={[styles.sectionHead, { gap: spacing.md, marginBottom: spacing.md }]}>
          <AppText
            style={[
              textStyles.caption,
              {
                color: colors.text.secondary,
                fontFamily: fontFamilies.semibold,
              },
            ]}
          >
            Today&apos;s care
          </AppText>

          <Pressable
            onPress={onPressOpenHealthSchedule}
            accessibilityRole="button"
            hitSlop={8}
            accessibilityLabel="Open today's care"
          >
            <AppText
              style={[
                textStyles.caption,
                { color: colors.accent, fontFamily: fontFamilies.bold },
              ]}
            >
              Open care
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
                borderRadius: theme.radius.xl,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surface,
                padding: spacing.xl,
              },
            ]}
          >
            <AppText
              style={[
                textStyles.body,
                { color: colors.text.secondary, textAlign: 'center' },
              ]}
            >
              Nothing scheduled for today.
            </AppText>
          </View>
        ) : null}

        {!loading && items.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            {items.map((item, index) => (
              <PetProfileTodayCareRow
                key={item.reminder.id}
                item={item}
                index={index}
              />
            ))}
          </View>
        ) : null}
      </View>
    );
  });

PetProfileTodayCareSection.displayName = 'PetProfileTodayCareSection';

const styles = StyleSheet.create({
  wrap: {},
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    borderWidth: 1,
  },
});
