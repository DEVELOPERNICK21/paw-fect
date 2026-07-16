import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../../../shared/hooks/useTheme';
import type { OnboardingGoal } from '../../../domain/onboarding/OnboardingDraft';

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
};

const createStyles = ({ colors, spacing, radius }: ThemeParams) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      alignItems: 'center',
    },
    title: {
      fontSize: 26,
      lineHeight: 32,
      color: colors.text.heading,
      textAlign: 'center',
      letterSpacing: -0.6,
    },
    subtitle: {
      marginTop: spacing.md,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.body,
      textAlign: 'center',
    },
    list: {
      marginTop: spacing.xl,
      width: '100%',
    },
    card: {
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
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    glyph: {
      fontSize: 20,
      marginRight: spacing.sm,
    },
    label: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.text.heading,
    },
    description: {
      marginTop: spacing.xs,
      fontSize: 13,
      lineHeight: 19,
      color: colors.text.body,
    },
  });

export const GoalStep: React.FC<Props> = ({ selected, onSelect }) => {
  const { colors, fontFamilies, spacing, radius } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontFamily: fontFamilies.extrabold }]}>
        What would make the biggest difference?
      </Text>
      <Text style={[styles.subtitle, { fontFamily: fontFamilies.medium }]}>
        Choose the outcome that matters most right now.
      </Text>
      <View style={styles.list}>
        {GOAL_OPTIONS.map(option => {
          const isSelected = selected === option.id;
          return (
            <Pressable
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
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
