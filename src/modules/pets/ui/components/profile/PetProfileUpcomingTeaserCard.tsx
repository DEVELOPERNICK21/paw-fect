import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../../shared/hooks/useTheme';

export interface PetProfileUpcomingTeaserCardProps {
  title: string;
  onPressSchedule: () => void;
}

export const PetProfileUpcomingTeaserCard: React.FC<PetProfileUpcomingTeaserCardProps> =
  React.memo(({ title, onPressSchedule }) => {
    const theme = useTheme();
    const { colors, radius, spacing, textStyles, fontFamilies } = theme;

    return (
      <View
        style={[
          styles.card,
          {
            borderRadius: radius.lg,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: colors.borderSubtle,
            backgroundColor: colors.surfaceAlt,
            padding: spacing.lg,
            gap: spacing.md,
            marginVertical: spacing['2xl'],
          },
        ]}
      >
        <View style={[styles.headRow, { gap: spacing.xs }]}>
          <MaterialIcon name="calendar_today" size={20} color={colors.accent} />
          <AppText
            style={[
              textStyles.overline,
              { color: colors.text.secondary, fontFamily: fontFamilies.bold },
            ]}
          >
            UPCOMING
          </AppText>
        </View>

        <AppText style={[textStyles.caption, { color: colors.text.body }]}>
          You have a {title} coming up soon.
        </AppText>

        <Pressable
          onPress={onPressSchedule}
          accessibilityRole="button"
          accessibilityLabel="Schedule reminder"
        >
          <AppText
            style={[
              textStyles.footerLink,
              {
                alignItems: 'center',
                color: colors.accent,
                fontFamily: fontFamilies.semibold,
                // alignSelf: 'center',
                textDecorationLine: 'underline',
              },
            ]}
          >
            Schedule Reminder
          </AppText>
        </Pressable>
      </View>
    );
  });

PetProfileUpcomingTeaserCard.displayName = 'PetProfileUpcomingTeaserCard';

const styles = StyleSheet.create({
  card: {},
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
