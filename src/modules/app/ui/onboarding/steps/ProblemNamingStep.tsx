import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../../shared/theme/typography';
import type { OnboardingProblem } from '../../../domain/onboarding/OnboardingDraft';

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
    title: {
      fontSize: fontSizes['2xl'],
      lineHeight: lineHeights['2xl'],
      color: colors.text.heading,
      textAlign: 'center',
      letterSpacing: -0.6,
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
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.lg,
      marginBottom: spacing.sm,
    },
    cardSelected: {
      backgroundColor: colors.brandTint5,
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

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontFamily: fontFamilies.extrabold }]}>
        What&apos;s been hardest for you and your pet?
      </Text>
      <Text style={[styles.subtitle, { fontFamily: fontFamilies.medium }]}>
        Pick everything that feels familiar — we&apos;ll build your plan
        around it.
      </Text>
      <View style={styles.list}>
        {PROBLEM_OPTIONS.map(option => {
          const isSelected = selected.includes(option.id);
          return (
            <Pressable
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
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
