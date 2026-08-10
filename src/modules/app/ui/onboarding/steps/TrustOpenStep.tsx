import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../../shared/theme/typography';
import { AccentHeadline } from '../components/AccentHeadline';
import { OnboardingBlobBackdrop } from '../components/OnboardingBlobBackdrop';

type ThemeParams = {
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radius: ReturnType<typeof useTheme>['radius'];
  fontSizes: ReturnType<typeof useTheme>['fontSizes'];
};

const createStyles = ({ colors, spacing, radius, fontSizes }: ThemeParams) =>
  StyleSheet.create({
    root: {
      position: 'relative',
      paddingBottom: spacing.md,
    },
    container: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing['3xl'],
      alignItems: 'center',
    },
    badge: {
      width: 72,
      height: 72,
      borderRadius: radius.round,
      backgroundColor: colors.brandTint10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: colors.brandTint20,
    },
    badgeGlyph: {
      fontSize: fontSizes['2xl'],
    },
    subtitle: {
      marginTop: spacing.md,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.base,
      color: colors.text.body,
      textAlign: 'center',
    },
    reassurance: {
      marginTop: spacing['2xl'],
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.brandTint10,
      width: '100%',
    },
    reassuranceText: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      color: colors.text.secondary,
      textAlign: 'center',
    },
  });

export const TrustOpenStep: React.FC = () => {
  const { colors, fontFamilies, fontSizes, spacing, radius } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, radius, fontSizes }),
    [colors, spacing, radius, fontSizes],
  );

  return (
    <View style={styles.root}>
      <OnboardingBlobBackdrop />
      <View style={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeGlyph}>🐾</Text>
        </View>
        <AccentHeadline
          segments={[
            { type: 'text', value: "You haven't missed anything important — " },
            { type: 'accent', value: 'yet' },
            { type: 'text', value: '.' },
          ]}
        />
        <Text style={[styles.subtitle, { fontFamily: fontFamilies.medium }]}>
          Pawsoul is built for pet parents who worry they&apos;ve missed a
          vaccine, a walk, or a warning sign — and want to feel calm and in
          control again.
        </Text>
        <View style={styles.reassurance}>
          <Text
            style={[
              styles.reassuranceText,
              { fontFamily: fontFamilies.medium },
            ]}
          >
            A few quick questions, then a plan made just for your pet.
          </Text>
        </View>
      </View>
    </View>
  );
};
