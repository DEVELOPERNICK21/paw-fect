import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../../../shared/hooks/useTheme';

type ThemeParams = {
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radius: ReturnType<typeof useTheme>['radius'];
};

const createStyles = ({ colors, spacing, radius }: ThemeParams) =>
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
      fontSize: 28,
    },
    title: {
      fontSize: 28,
      lineHeight: 34,
      color: colors.text.heading,
      textAlign: 'center',
      letterSpacing: -0.6,
    },
    subtitle: {
      marginTop: spacing.md,
      fontSize: 15,
      lineHeight: 22,
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
      fontSize: 13,
      lineHeight: 19,
      color: colors.text.secondary,
      textAlign: 'center',
    },
  });

export const TrustOpenStep: React.FC = () => {
  const { colors, fontFamilies, spacing, radius } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
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
        Pawfect is built for pet parents who worry they&apos;ve missed a
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
