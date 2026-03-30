import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../../../shared/components/AppText';
import { icons } from '../../../../../shared/assets/icons';
import type { PetGender } from '../../../domain/models/Pet';
import type { Theme } from '../../../../../shared/hooks/useTheme';
import { useTheme } from '../../../../../shared/hooks/useTheme';
import { spacing } from '../../../../../shared/theme/spacing';
import { colors } from '../../../../../shared/theme/colors';

export interface PetProfileQuickStatsRowProps {
  weightValue: string;
  genderValue: string;
  birthdayValue: string;
  petGender?: PetGender;
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  stripWeightPrefix?: boolean;
  value: string;
  theme: Theme;
}> = React.memo(({ icon, label, stripWeightPrefix, value, theme }) => {
  const { colors, radius, spacing, textStyles, fontFamilies } = theme;

  const displayValue = stripWeightPrefix
    ? value.replace(/^\s*weight\s*:?\s*/i, '').trim()
    : value;

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          flex: 1,
        },
      ]}
    >
      {icon}
      <AppText
        style={[
          textStyles.caption,
          {
            marginTop: spacing.md,
            color: colors.text.secondary,
            fontFamily: fontFamilies.semibold,
            textAlign: 'center',
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </AppText>
      <AppText
        style={[
          textStyles.subtitle,
          {
            marginTop: spacing.xs,
            color: colors.text.heading,
            fontFamily: fontFamilies.bold,
            textAlign: 'center',
          },
        ]}
        numberOfLines={1}
      >
        {displayValue}
      </AppText>
    </View>
  );
});

StatCard.displayName = 'StatCard';

export const PetProfileQuickStatsRow: React.FC<PetProfileQuickStatsRowProps> =
  React.memo(({ weightValue, genderValue, birthdayValue, petGender }) => {
    const theme = useTheme();
    const { spacing } = theme;

    const GenderIcon =
      petGender === 'female' ? icons.femaleIcon : icons.maleIcon;

    return (
      <View style={[styles.row, { gap: spacing.lg }]}>
        <StatCard
          icon={<icons.weightIcon width={20} height={20} />}
          stripWeightPrefix
          label="WEIGHT"
          value={weightValue}
          theme={theme}
        />
        <StatCard
          icon={<GenderIcon width={20} height={20} />}
          label="GENDER"
          value={genderValue}
          theme={theme}
        />
        <StatCard
          icon={<icons.cakeIcon width={20} height={20} />}
          label="BIRTHDAY"
          value={birthdayValue}
          theme={theme}
        />
      </View>
    );
  });

PetProfileQuickStatsRow.displayName = 'PetProfileQuickStatsRow';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: spacing['4xl'] * 2.6,
    justifyContent: 'center',
    alignContent: 'center',
    marginVertical: spacing.md,
  },
  card: {
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
