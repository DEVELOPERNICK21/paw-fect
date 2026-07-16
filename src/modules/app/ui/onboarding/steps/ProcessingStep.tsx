import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../../shared/theme/typography';

const PROCESSING_DURATION_MS = 2000;

type Props = {
  nickname: string;
  onDone: () => void;
};

type ThemeParams = {
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  fontSizes: ReturnType<typeof useTheme>['fontSizes'];
};

const createStyles = ({ colors, spacing, fontSizes }: ThemeParams) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing['4xl'],
      alignItems: 'center',
    },
    title: {
      marginTop: spacing.xl,
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.lg,
      color: colors.text.heading,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: spacing.sm,
      fontSize: fontSizes.lead,
      lineHeight: lineHeights.md,
      color: colors.text.body,
      textAlign: 'center',
    },
  });

export const ProcessingStep: React.FC<Props> = ({ nickname, onDone }) => {
  const { colors, fontFamilies, fontSizes, spacing } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, fontSizes }),
    [colors, spacing, fontSizes],
  );

  useEffect(() => {
    const timer = setTimeout(onDone, PROCESSING_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  const petLabel = nickname.trim().length > 0 ? nickname.trim() : 'your pet';

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={[styles.title, { fontFamily: fontFamilies.bold }]}>
        Building {petLabel}&apos;s care plan…
      </Text>
      <Text style={[styles.subtitle, { fontFamily: fontFamilies.medium }]}>
        Matching your answers to a routine that fits.
      </Text>
    </View>
  );
};
