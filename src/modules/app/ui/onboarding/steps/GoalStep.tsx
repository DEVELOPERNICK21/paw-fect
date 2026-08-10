import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../../shared/theme/typography';
import type { OnboardingGoal } from '../../../domain/onboarding/OnboardingDraft';
import { AccentHeadline } from '../components/AccentHeadline';
import { ScalePressable } from '../components/ScalePressable';

type GoalOption = {
  id: OnboardingGoal;
  label: string;
  description: string;
  glyph: string;
};

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'never_miss_care',
    label: 'Never miss care',
    description: 'Gentle reminders help you show up on time for what matters.',
    glyph: '⏰',
  },
  {
    id: 'health_history',
    label: 'Track health history',
    description: 'Keep a clear timeline of visits and milestones.',
    glyph: '📖',
  },
  {
    id: 'multi_pet_calm',
    label: 'Feel calm with multiple pets',
    description: 'One simple view for every pet in your home.',
    glyph: '🧘',
  },
];

type Props = {
  selected: OnboardingGoal | null;
  onSelect: (goal: OnboardingGoal) => void;
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
  });

export const GoalStep: React.FC<Props> = ({ selected, onSelect }) => {
  const { colors, fontFamilies, fontSizes, spacing, radius } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, radius, fontSizes }),
    [colors, spacing, radius, fontSizes],
  );

  return (
    <View style={styles.container}>
      <AccentHeadline
        segments={[
          { type: 'text', value: 'What would make the ' },
          { type: 'accent', value: 'biggest' },
          { type: 'text', value: ' difference?' },
        ]}
      />
      <Text style={[styles.subtitle, { fontFamily: fontFamilies.medium }]}>
        Choose the outcome that matters most right now.
      </Text>
      <View style={styles.list}>
        {GOAL_OPTIONS.map(option => {
          const isSelected = selected === option.id;
          return (
            <ScalePressable
              key={option.id}
              onPress={() => onSelect(option.id)}
              style={[
                styles.card,
                isSelected ? styles.cardSelected : styles.cardIdle,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
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
    </View>
  );
};
