import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppText } from '../../../../../shared/components/AppText';
import { useTheme } from '../../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../../shared/theme/typography';
import { buildReminderDraftDefaults } from '../../../domain/onboarding/buildReminderDraftDefaults';
import type {
  ActivationReminderKind,
  ReminderDraft,
} from '../../../domain/onboarding/OnboardingDraft';
import { formatActivationReminderSummary } from '../../../domain/onboarding/activationStepValidation';
import { AccentHeadline } from '../components/AccentHeadline';
import { ScalePressable } from '../components/ScalePressable';

type ReminderOption = {
  kind: ActivationReminderKind;
  label: string;
  description: string;
  glyph: string;
};

const REMINDER_OPTIONS: ReminderOption[] = [
  {
    kind: 'walk',
    label: 'Walk',
    description: 'Daily walks keep tails wagging.',
    glyph: '🐾',
  },
  {
    kind: 'vaccination',
    label: 'Vaccine',
    description: 'Stay ahead of important shots.',
    glyph: '💉',
  },
  {
    kind: 'medication',
    label: 'Medication',
    description: 'Never miss a dose again.',
    glyph: '💊',
  },
  {
    kind: 'checkup',
    label: 'Checkup',
    description: 'Plan vet visits with confidence.',
    glyph: '🩺',
  },
];

type Props = {
  nickname: string;
  value: ReminderDraft | null;
  onChange: (next: ReminderDraft) => void;
};

type ThemeParams = {
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radius: ReturnType<typeof useTheme>['radius'];
  fontSizes: ReturnType<typeof useTheme>['fontSizes'];
};

const createStyles = ({ colors, spacing, radius, fontSizes }: ThemeParams) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    subtitle: {
      marginTop: spacing.md,
      color: colors.text.body,
      textAlign: 'center',
    },
    list: {
      marginTop: spacing.xl,
      width: '100%',
    },
    card: {
      borderRadius: radius.lg,
      borderWidth: 2,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      width: '100%',
    },
    cardSelected: {
      backgroundColor: colors.brandTint10,
      borderColor: colors.accent,
    },
    cardIdle: {
      backgroundColor: colors.surface,
      borderColor: colors.borderSubtle,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    glyph: {
      fontSize: fontSizes.lg,
      marginRight: spacing.sm,
    },
    label: {
      fontSize: fontSizes.md,
      lineHeight: lineHeights.base,
      color: colors.text.heading,
    },
    description: {
      marginTop: spacing.xs,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      color: colors.text.body,
    },
    summarySection: {
      marginTop: spacing.lg,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    summaryLabel: {
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.xs,
      color: colors.text.secondary,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    summaryValue: {
      marginTop: spacing.xs,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.base,
      color: colors.text.heading,
    },
  });

export const FirstReminderStep: React.FC<Props> = ({
  nickname,
  value,
  onChange,
}) => {
  const { colors, fontFamilies, fontSizes, spacing, radius } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, radius, fontSizes }),
    [colors, spacing, radius, fontSizes],
  );

  const trimmedNickname = nickname.trim() || 'your pet';
  const summary = value ? formatActivationReminderSummary(value) : null;

  const handleSelect = useCallback(
    (kind: ActivationReminderKind) => {
      onChange(buildReminderDraftDefaults(kind, trimmedNickname, new Date()));
    },
    [onChange, trimmedNickname],
  );

  return (
    <View style={styles.container}>
      <AccentHeadline
        segments={[
          { type: 'text', value: 'Pick ' },
          { type: 'accent', value: 'one' },
          { type: 'text', value: ' reminder to start.' },
        ]}
      />
      <AppText style={[styles.subtitle, { fontFamily: fontFamilies.medium }]}>
        We&apos;ll set a sensible default you can tweak later.
      </AppText>

      <View style={styles.list}>
        {REMINDER_OPTIONS.map(option => {
          const isSelected = value?.kind === option.kind;

          return (
            <ScalePressable
              key={option.kind}
              onPress={() => handleSelect(option.kind)}
              style={[
                styles.card,
                isSelected ? styles.cardSelected : styles.cardIdle,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={option.label}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.glyph}>{option.glyph}</Text>
                <Text
                  style={[styles.label, { fontFamily: fontFamilies.bold }]}
                >
                  {option.label}
                </Text>
              </View>
              <Text
                style={[
                  styles.description,
                  { fontFamily: fontFamilies.medium },
                ]}
              >
                {option.description}
              </Text>
            </ScalePressable>
          );
        })}
      </View>

      {summary ? (
        <View style={styles.summarySection}>
          <Text
            style={[styles.summaryLabel, { fontFamily: fontFamilies.semibold }]}
          >
            Scheduled for
          </Text>
          <Text
            style={[styles.summaryValue, { fontFamily: fontFamilies.medium }]}
          >
            {summary}
          </Text>
        </View>
      ) : null}
    </View>
  );
};
