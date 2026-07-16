import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../../shared/theme/typography';

type Props = {
  nickname: string;
  accepted: boolean;
  onToggle: () => void;
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
    card: {
      marginTop: spacing.xl,
      width: '100%',
      borderRadius: radius.lg,
      borderWidth: 2,
      padding: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardSelected: {
      backgroundColor: colors.brandTint5,
      borderColor: colors.accent,
    },
    cardIdle: {
      backgroundColor: colors.surface,
      borderColor: colors.borderSubtle,
    },
    checkCircle: {
      width: 28,
      height: 28,
      borderRadius: radius.round,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    checkCircleSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    checkCircleIdle: {
      borderColor: colors.borderSubtle,
    },
    checkGlyph: {
      fontSize: fontSizes.lead,
      color: colors.text.inverse,
    },
    cardLabel: {
      flex: 1,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.base,
      color: colors.text.heading,
    },
  });

export const CommitmentStep: React.FC<Props> = ({
  nickname,
  accepted,
  onToggle,
}) => {
  const { colors, fontFamilies, fontSizes, spacing, radius } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, radius, fontSizes }),
    [colors, spacing, radius, fontSizes],
  );

  const petLabel = nickname.trim().length > 0 ? nickname.trim() : 'your pet';

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontFamily: fontFamilies.extrabold }]}>
        This is your moment to decide
      </Text>
      <Text style={[styles.subtitle, { fontFamily: fontFamilies.medium }]}>
        We&apos;ll help you keep the promise — one gentle reminder at a time.
      </Text>
      <Pressable
        onPress={onToggle}
        style={[styles.card, accepted ? styles.cardSelected : styles.cardIdle]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
      >
        <View
          style={[
            styles.checkCircle,
            accepted ? styles.checkCircleSelected : styles.checkCircleIdle,
          ]}
        >
          {accepted ? <Text style={styles.checkGlyph}>✓</Text> : null}
        </View>
        <Text style={[styles.cardLabel, { fontFamily: fontFamilies.bold }]}>
          I&apos;m ready to stay on top of {petLabel}&apos;s health.
        </Text>
      </Pressable>
    </View>
  );
};
