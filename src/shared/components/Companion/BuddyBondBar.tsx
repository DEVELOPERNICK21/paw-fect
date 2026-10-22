import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import type { BondProgress } from '../../companion/buddyBond';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../AppText';

export interface BuddyBondBarProps {
  progress: BondProgress;
  streakDays: number;
  testID?: string;
}

/** Bond level, title and progress to the next level, plus the day streak. */
export const BuddyBondBar: React.FC<BuddyBondBarProps> = ({
  progress,
  streakDays,
  testID,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies } = useTheme();
  const fill = useRef(new Animated.Value(progress.ratio)).current;

  useEffect(() => {
    Animated.timing(fill, {
      toValue: progress.ratio,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress.ratio, fill]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
          borderWidth: 1,
          borderRadius: radius.xl,
          padding: spacing.md,
        },
        badge: {
          width: 46,
          height: 46,
          borderRadius: 23,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
        },
        mid: { flex: 1, gap: 4 },
        track: {
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.borderSubtle,
          overflow: 'hidden',
        },
        fill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
        streak: {
          alignItems: 'center',
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: radius.pill,
          backgroundColor: colors.brandTint12,
        },
      }),
    [colors, radius, spacing],
  );

  return (
    <View
      style={styles.row}
      testID={testID}
      accessible
      accessibilityLabel={`Bond level ${progress.level}, ${progress.title}. ${progress.toNext} points to ${progress.nextTitle}. ${streakDays} day streak.`}
    >
      <View style={styles.badge}>
        <AppText
          style={[textStyles.caption, { color: colors.onAccent, fontFamily: fontFamilies.bold }]}
        >
          Lv {progress.level}
        </AppText>
      </View>
      <View style={styles.mid}>
        <AppText
          style={[textStyles.body, { color: colors.text.heading, fontFamily: fontFamilies.semibold }]}
        >
          {progress.title}
        </AppText>
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.fill,
              { width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
            ]}
          />
        </View>
        <AppText style={[textStyles.footer, { color: colors.text.subdued }]}>
          {progress.toNext} to {progress.nextTitle}
        </AppText>
      </View>
      {streakDays > 0 ? (
        <View style={styles.streak}>
          <Text>🔥</Text>
          <AppText
            style={[textStyles.footer, { color: colors.accent, fontFamily: fontFamilies.bold }]}
          >
            {streakDays}
          </AppText>
        </View>
      ) : null}
    </View>
  );
};
