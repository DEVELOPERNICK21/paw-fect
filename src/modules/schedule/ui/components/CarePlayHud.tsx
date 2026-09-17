import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { Paw3dIcon } from '../../../../shared/components/Paw3dIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';

export interface CarePlayHudProps {
  doneCount: number;
  totalCount: number;
  streakDays: number;
  /** Bumps when a task is completed — drives progress animation. */
  pulseToken?: number;
}

function milestoneCopy(ratio: number, done: number, total: number): string {
  if (total <= 0) {
    return 'Start a care task to build your streak';
  }
  if (ratio >= 1) {
    return 'Day complete — streak protected';
  }
  if (ratio >= 0.75) {
    return 'Almost there — keep going';
  }
  if (ratio >= 0.5) {
    return 'Halfway hero';
  }
  if (done > 0) {
    return `+${done} care point${done === 1 ? '' : 's'} today`;
  }
  return 'Complete a task to earn care points';
}

/**
 * Secondary gamification strip — streak + animated progress.
 * Never competes with the Level-1 attention card.
 */
export const CarePlayHud: React.FC<CarePlayHudProps> = ({
  doneCount,
  totalCount,
  streakDays,
  pulseToken = 0,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies, shadows } =
    useTheme();
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  const ratio = totalCount > 0 ? doneCount / totalCount : 0;
  const copy = milestoneCopy(ratio, doneCount, totalCount);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surface,
          padding: spacing.lg,
          gap: spacing.md,
          overflow: 'hidden',
        },
        topRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
        },
        streakChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.pill,
          backgroundColor: colors.brandTint12,
        },
        points: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        track: {
          height: 10,
          borderRadius: radius.pill,
          backgroundColor: colors.brandTint10,
          overflow: 'hidden',
        },
        fill: {
          height: '100%',
          borderRadius: radius.pill,
          overflow: 'hidden',
        },
        fillGradient: {
          flex: 1,
          width: '100%',
          height: '100%',
        },
        dots: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: spacing.xs,
        },
        dot: {
          flex: 1,
          height: 4,
          borderRadius: 2,
        },
      }),
    [colors, radius, spacing],
  );

  useEffect(() => {
    Animated.timing(progress, {
      toValue: ratio,
      duration: 420,
      useNativeDriver: false,
    }).start();
  }, [progress, ratio]);

  useEffect(() => {
    if (pulseToken <= 0) {
      return;
    }
    pulse.setValue(1);
    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1.04,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [pulse, pulseToken]);

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const segmentCount = Math.min(Math.max(totalCount, 1), 6);

  return (
    <Animated.View
      style={[styles.card, shadows.sm, { transform: [{ scale: pulse }] }]}
    >
      <View style={styles.topRow}>
        <View style={styles.streakChip}>
          <MaterialIcon name="favorite" size={14} color={colors.accent} />
          <AppText
            style={[
              textStyles.caption,
              {
                color: colors.text.heading,
                fontFamily: fontFamilies.bold,
                fontVariant: ['tabular-nums'],
              },
            ]}
          >
            {streakDays > 0 ? `${streakDays}-day streak` : 'Start a streak'}
          </AppText>
        </View>
        <View style={styles.points}>
          <Paw3dIcon size={16} />
          <AppText
            style={[
              textStyles.caption,
              {
                color: colors.text.heading,
                fontFamily: fontFamilies.bold,
                fontVariant: ['tabular-nums'],
              },
            ]}
          >
            {doneCount}/{totalCount}
          </AppText>
        </View>
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: fillWidth }]}>
          <LinearGradient
            colors={[colors.primaryLight, colors.accent, colors.primaryDark]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.fillGradient}
          />
        </Animated.View>
      </View>

      {totalCount > 0 ? (
        <View style={styles.dots}>
          {Array.from({ length: segmentCount }).map((_, index) => {
            const filled =
              totalCount <= segmentCount
                ? index < doneCount
                : index < Math.round(ratio * segmentCount);
            return (
              <View
                key={`seg-${index}`}
                style={[
                  styles.dot,
                  {
                    backgroundColor: filled
                      ? colors.accent
                      : colors.brandTint10,
                  },
                ]}
              />
            );
          })}
        </View>
      ) : null}

      <AppText
        style={[
          textStyles.footer,
          {
            color: colors.text.secondary,
            fontFamily: fontFamilies.medium,
            textAlign: 'center',
          },
        ]}
      >
        {copy}
      </AppText>
    </Animated.View>
  );
};
