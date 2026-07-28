import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../../shared/theme/typography';

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
      paddingTop: spacing['3xl'],
      alignItems: 'center',
    },
    badge: {
      width: 64,
      height: 64,
      borderRadius: radius.round,
      backgroundColor: colors.brandTint10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xl,
    },
    badgeGlyph: {
      fontSize: fontSizes['2xl'],
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
      backgroundColor: colors.brandTint5,
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
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeGlyph}>🐾</Text>
      </View>
      <Text style={[styles.title, { fontFamily: fontFamilies.extrabold }]}>
        You haven&apos;t missed anything important — yet.
      </Text>
      <Text style={[styles.subtitle, { fontFamily: fontFamilies.medium }]}>
        Pawsoul is built for pet parents who worry they&apos;ve missed a
        vaccine, a walk, or a warning sign — and want to feel calm and in
        control again.
      </Text>
      <View style={styles.reassurance}>
        <Text
          style={[styles.reassuranceText, { fontFamily: fontFamilies.medium }]}
        >
          A few quick questions, then a plan made just for your pet.
        </Text>
      </View>
    </View>
  );
};
