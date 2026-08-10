import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { trackEvent } from '../../../../../infrastructure/analytics/analytics';
import { useTheme } from '../../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../../shared/theme/typography';
import type { OnboardingProblem } from '../../../domain/onboarding/OnboardingDraft';
import {
  validationCopyForProblems,
  validationVariantIdForProblems,
} from '../../../domain/onboarding/onboardingValidationCopy';
import { AccentHeadline } from '../components/AccentHeadline';
import { ScalePressable } from '../components/ScalePressable';

type ProblemOption = {
  id: OnboardingProblem;
  label: string;
  glyph: string;
};

const PROBLEM_OPTIONS: ProblemOption[] = [
  { id: 'missed_vaccines', label: 'Missed vaccines', glyph: '💉' },
  { id: 'no_records', label: 'No records', glyph: '📋' },
  { id: 'chaotic_routine', label: 'Chaotic routine', glyph: '🌀' },
  { id: 'vet_bill_surprises', label: 'Vet bill surprises', glyph: '💸' },
];

type Props = {
  selected: OnboardingProblem[];
  onToggle: (problem: OnboardingProblem) => void;
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
      paddingTop: spacing.xl,
      alignItems: 'center',
    },
    subtitle: {
      marginTop: spacing.md,
      fontSize: fontSizes.lead,
      lineHeight: lineHeights.md,
      color: colors.text.body,
      textAlign: 'center',
    },
    list: {
      marginTop: spacing.xl,
      width: '100%',
    },
    validation: {
      marginTop: spacing.md,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      color: colors.text.body,
      textAlign: 'center',
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: radius.lg,
      borderWidth: 2,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      width: '100%',
      minHeight: 64,
    },
    cardSelected: {
      backgroundColor: colors.brandTint10,
      borderColor: colors.accent,
    },
    cardIdle: {
      backgroundColor: colors.surface,
      borderColor: colors.borderSubtle,
    },
    glyph: {
      fontSize: fontSizes.xl,
      marginRight: spacing.md,
    },
    label: {
      fontSize: fontSizes.md,
      lineHeight: lineHeights.base,
      color: colors.text.heading,
      flex: 1,
    },
  });

export const ProblemNamingStep: React.FC<Props> = ({ selected, onToggle }) => {
  const { colors, fontFamilies, fontSizes, spacing, radius } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, radius, fontSizes }),
    [colors, spacing, radius, fontSizes],
  );

  const validation = validationCopyForProblems(selected);
  const variant = validationVariantIdForProblems(selected);
  const lastTrackedVariant = useRef<string | null>(null);

  useEffect(() => {
    if (!variant || variant === lastTrackedVariant.current) {
      return;
    }
    lastTrackedVariant.current = variant;
    void trackEvent('onboarding_validation_shown', {
      step: 2,
      variant_shown: variant,
    });
  }, [variant]);

  return (
    <View style={styles.container}>
      <AccentHeadline
        segments={[
          { type: 'text', value: "What's been " },
          { type: 'accent', value: 'hardest' },
          { type: 'text', value: ' for you and your pet?' },
        ]}
      />
      <Text style={[styles.subtitle, { fontFamily: fontFamilies.medium }]}>
        Pick everything that feels familiar — we&apos;ll build your plan
        around it.
      </Text>
      <View style={styles.list}>
        {PROBLEM_OPTIONS.map(option => {
          const isSelected = selected.includes(option.id);
          return (
            <ScalePressable
              key={option.id}
              onPress={() => onToggle(option.id)}
              style={[
                styles.card,
                isSelected ? styles.cardSelected : styles.cardIdle,
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
            >
              <Text style={styles.glyph}>{option.glyph}</Text>
              <Text
                style={[styles.label, { fontFamily: fontFamilies.medium }]}
              >
                {option.label}
              </Text>
            </ScalePressable>
          );
        })}
      </View>
      {validation ? (
        <Text style={[styles.validation, { fontFamily: fontFamilies.medium }]}>
          {validation}
        </Text>
      ) : null}
    </View>
  );
};
