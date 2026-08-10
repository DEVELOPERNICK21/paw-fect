import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { trackEvent } from '../../../../infrastructure/analytics/analytics';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../shared/theme/typography';
import type { CareInterest } from '../../../settings/domain/models/Settings';
import {
  validationCopyForCareInterests,
  validationVariantIdForCareInterests,
} from '../../domain/onboarding/onboardingValidationCopy';
import { AccentHeadline } from '../onboarding/components/AccentHeadline';
import { ScalePressable } from '../onboarding/components/ScalePressable';
import { CARE_INTEREST_OPTIONS } from '../onboarding/careInterestUtils';

type Props = {
  selected: CareInterest[];
  onToggle: (interest: CareInterest) => void;
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
      fontSize: fontSizes.md,
      lineHeight: lineHeights.base,
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
      borderWidth: 2,
      minHeight: 48,
      justifyContent: 'center',
    },
    chipSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipIdle: {
      backgroundColor: colors.surface,
      borderColor: colors.brandTint20,
    },
    chipLabel: {
      fontSize: fontSizes.lead,
      lineHeight: lineHeights.md,
    },
    validation: {
      marginTop: spacing.md,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      color: colors.text.body,
      textAlign: 'center',
    },
  });

export const OnboardingCareInterestsStep: React.FC<Props> = ({
  selected,
  onToggle,
}) => {
  const { colors, fontFamilies, fontSizes, spacing, radius } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, radius, fontSizes }),
    [colors, spacing, radius, fontSizes],
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
      <AccentHeadline
        segments={[
          { type: 'text', value: 'What do you care about ' },
          { type: 'accent', value: 'most' },
          { type: 'text', value: '?' },
        ]}
      />
      <Text style={[styles.subtitle, { fontFamily: fontFamilies.medium }]}>
        Pick the reminders that matter — you can change focus anytime by
        building your routine.
      </Text>
      <View style={styles.chips}>
        {CARE_INTEREST_OPTIONS.map(option => {
          const isSelected = selected.includes(option.id);
          return (
            <ScalePressable
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
