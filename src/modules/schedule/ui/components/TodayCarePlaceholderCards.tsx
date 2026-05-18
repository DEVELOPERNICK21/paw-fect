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
  completionPercent,
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
          textStyles.title,
          { color: colors.text.heading, fontFamily: fontFamilies.bold },
        ]}
      >
        {petName}&apos;s day is complete
      </AppText>
      <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
        Great job today. Wellness score {completionPercent}%.
      </AppText>
    </View>
  );
};

export interface TodayCareSetupPlaceholderProps {
  petName: string;
  onPressSetup: () => void;
}

export const TodayCareSetupPlaceholder: React.FC<TodayCareSetupPlaceholderProps> = ({
  petName,
  onPressSetup,
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
          gap: spacing.md,
        },
      }),
    [colors, radius, spacing],
  );

  return (
    <View style={styles.card}>
      <AppText
        style={[
          textStyles.title,
          { color: colors.text.heading, fontFamily: fontFamilies.bold },
        ]}
      >
        Build {petName}&apos;s daily rhythm
      </AppText>
      <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
        Set wake time, meals, and walks once. Pawfect turns that into a clear
        care plan for today.
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
          backgroundColor: colors.surfaceAlt,
          padding: spacing.xl,
        },
      }),
    [colors, radius, spacing],
  );

  return (
    <View style={styles.card}>
      <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
        Loading today&apos;s care plan…
      </AppText>
    </View>
  );
};
