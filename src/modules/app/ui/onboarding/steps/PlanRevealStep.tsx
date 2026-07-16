import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../../../shared/hooks/useTheme';
import type { CarePlanSummary } from '../../../domain/onboarding/buildCarePlanSummary';

type Props = {
  summary: CarePlanSummary;
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
    badge: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.accent,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    title: {
      marginTop: spacing.sm,
      fontSize: 26,
      lineHeight: 32,
      color: colors.text.heading,
      textAlign: 'center',
      letterSpacing: -0.6,
    },
    bulletList: {
      marginTop: spacing.xl,
      width: '100%',
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.brandTint5,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.brandTint10,
      padding: spacing.lg,
      marginBottom: spacing.sm,
    },
    bulletGlyph: {
      fontSize: 16,
      color: colors.accent,
      marginRight: spacing.sm,
    },
    bulletText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.heading,
    },
    tipCard: {
      marginTop: spacing.md,
      width: '100%',
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.lg,
    },
    tipLabel: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    tipText: {
      marginTop: spacing.xs,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.body,
    },
  });

export const PlanRevealStep: React.FC<Props> = ({ summary }) => {
  const { colors, fontFamilies, spacing, radius } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.badge, { fontFamily: fontFamilies.bold }]}>
        Your plan is ready
      </Text>
      <Text style={[styles.title, { fontFamily: fontFamilies.extrabold }]}>
        {summary.title}
      </Text>
      <View style={styles.bulletList}>
        {summary.bullets.map(bullet => (
          <View key={bullet} style={styles.bulletRow}>
            <Text style={styles.bulletGlyph}>✓</Text>
            <Text
              style={[styles.bulletText, { fontFamily: fontFamilies.medium }]}
            >
              {bullet}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.tipCard}>
        <Text style={[styles.tipLabel, { fontFamily: fontFamilies.bold }]}>
          Tip
        </Text>
        <Text style={[styles.tipText, { fontFamily: fontFamilies.medium }]}>
          {summary.tip}
        </Text>
      </View>
    </View>
  );
};
