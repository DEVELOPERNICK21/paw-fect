import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { trackEvent } from '../../../../infrastructure/analytics/analytics';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { CareInterest } from '../../../settings/domain/models/Settings';
import {
  validationCopyForCareInterests,
  validationVariantIdForCareInterests,
} from '../../domain/onboarding/onboardingValidationCopy';
import { CARE_INTEREST_OPTIONS } from '../onboarding/careInterestUtils';

type Props = {
  selected: CareInterest[];
  onToggle: (interest: CareInterest) => void;
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
      fontSize: 28,
      lineHeight: 34,
      color: colors.text.heading,
      textAlign: 'center',
      letterSpacing: -0.75,
    },
    subtitle: {
      marginTop: spacing.md,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.body,
      textAlign: 'center',
    },
    chips: {
      marginTop: spacing.xl,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    chipSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipIdle: {
      backgroundColor: colors.brandTint5,
      borderColor: colors.brandTint20,
    },
    chipLabel: {
      fontSize: 14,
      lineHeight: 20,
    },
    validation: {
      marginTop: spacing.md,
      fontSize: 13,
      lineHeight: 18,
      color: colors.text.body,
      textAlign: 'center',
    },
  });

export const OnboardingCareInterestsStep: React.FC<Props> = ({
  selected,
  onToggle,
}) => {
  const { colors, fontFamilies, spacing, radius } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  const validation = validationCopyForCareInterests(selected);
  const variant = validationVariantIdForCareInterests(selected);
  const lastTrackedVariant = useRef<string | null>(null);

  useEffect(() => {
    if (!variant || variant === lastTrackedVariant.current) {
      return;
    }
    lastTrackedVariant.current = variant;
    void trackEvent('onboarding_validation_shown', {
      step: 5,
      variant_shown: variant,
    });
  }, [variant]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontFamily: fontFamilies.extrabold }]}>
        What do you care about most?
      </Text>
      <Text style={[styles.subtitle, { fontFamily: fontFamilies.medium }]}>
        Pick the reminders that matter — you can change focus anytime by building
        your routine.
      </Text>
      <View style={styles.chips}>
        {CARE_INTEREST_OPTIONS.map(option => {
          const isSelected = selected.includes(option.id);
          return (
            <Pressable
              key={option.id}
              onPress={() => onToggle(option.id)}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipIdle,
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
            >
              <Text
                style={[
                  styles.chipLabel,
                  {
                    fontFamily: fontFamilies.bold,
                    color: isSelected
                      ? colors.text.inverse
                      : colors.text.heading,
                  },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
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
