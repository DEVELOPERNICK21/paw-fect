import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { HomeDashboardTodayCareItem } from '../../../../app/domain/models/HomeDashboardViewModel';
import { AppText } from '../../../../../shared/components/AppText';
import { useTheme } from '../../../../../shared/hooks/useTheme';
import { PetProfileTodayCareRow } from './PetProfileTodayCareRow';

export interface PetProfileTodayCareSectionProps {
  items: HomeDashboardTodayCareItem[];
  loading: boolean;
  onPressViewCalendar: () => void;
}

export const PetProfileTodayCareSection: React.FC<PetProfileTodayCareSectionProps> =
  React.memo(({ items, loading, onPressViewCalendar }) => {
    const theme = useTheme();
    const { colors, spacing, textStyles, fontFamilies } = theme;

    return (
      <View style={styles.wrap}>
        <View style={[styles.sectionHead, { gap: spacing.md }]}>
          <AppText
            style={[
              textStyles.title,
              { color: colors.text.heading, marginVertical: spacing.lg },
            ]}
          >
            Today&apos;s Care
          </AppText>

          <Pressable
            onPress={onPressViewCalendar}
            accessibilityRole="button"
            hitSlop={8}
          >
            <AppText
              style={[
                textStyles.caption,
                { color: colors.primary, fontFamily: fontFamilies.semibold },
              ]}
            >
              View Calendar
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
