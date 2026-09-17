import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { Button } from '../../../../shared/components/Button';
import { useTheme } from '../../../../shared/hooks/useTheme';

export interface TodayCareCompleteCardProps {
  petName: string;
  completionPercent: number;
}

export const TodayCareCompleteCard: React.FC<TodayCareCompleteCardProps> = ({
  petName,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surface,
          padding: spacing.xl,
          gap: spacing.sm,
        },
      }),
    [colors, radius, spacing],
  );

  return (
    <View style={styles.card}>
      <AppText
        style={[
          textStyles.subtitle,
          { color: colors.text.heading, fontFamily: fontFamilies.bold },
        ]}
      >
        {petName}&apos;s care is complete
      </AppText>
      <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
        Nice work looking after {petName} today.
      </AppText>
    </View>
  );
};

export interface TodayCareSetupPlaceholderProps {
  petName: string;
  onPressSetup: () => void;
}

export const TodayCareSetupPlaceholder: React.FC<
  TodayCareSetupPlaceholderProps
> = ({ petName, onPressSetup }) => {
  const { colors, spacing, radius, textStyles, fontFamilies } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surface,
          padding: spacing.xl,
          gap: spacing.md,
        },
      }),
    [colors, radius, spacing],
  );

  return (
    <View style={styles.card}>
      <AppText
        style={[
          textStyles.subtitle,
          { color: colors.text.heading, fontFamily: fontFamilies.bold },
        ]}
      >
        No care tasks yet
      </AppText>
      <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
        Set a daily rhythm for {petName} so we can show what&apos;s next.
      </AppText>
      <Button title="Set up care schedule" onPress={onPressSetup} />
    </View>
  );
};

export const TodayCareLoadingPlaceholder: React.FC = () => {
  const { colors, spacing, radius, textStyles } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surface,
          padding: spacing.xl,
          alignItems: 'center',
        },
      }),
    [colors, radius, spacing],
  );

  return (
    <View style={styles.card}>
      <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
        Loading care plan…
      </AppText>
    </View>
  );
};
