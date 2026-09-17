import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';

export type CareRewardKind = 'task' | 'day';

export interface WellnessCompletionToastProps {
  visible: boolean;
  petName: string;
  onDismiss: () => void;
  /** Optional XP / streak line under the title. */
  rewardKind?: CareRewardKind;
  streakDays?: number;
  taskLabel?: string;
}

export const WellnessCompletionToast: React.FC<WellnessCompletionToastProps> = ({
  visible,
  petName,
  onDismiss,
  rewardKind = 'task',
  streakDays = 0,
  taskLabel,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies, shadows } =
    useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          position: 'absolute',
          left: spacing.lg,
          right: spacing.lg,
          top: spacing.sm,
          zIndex: 20,
        },
        banner: {
          borderRadius: radius.xl,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor:
            rewardKind === 'day' ? colors.accent : colors.success,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        },
        iconWell: {
          width: 40,
          height: 40,
          borderRadius: radius.round,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            rewardKind === 'day' ? colors.brandTint12 : colors.successSurface,
        },
        textCol: { flex: 1, minWidth: 0, gap: 2 },
        xpChip: {
          alignSelf: 'flex-start',
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: radius.pill,
          backgroundColor: colors.brandTint12,
        },
      }),
    [colors, radius, rewardKind, spacing],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    opacity.setValue(0);
    translateY.setValue(-10);
    scale.setValue(0.94);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(rewardKind === 'day' ? 3200 : 2400),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -6,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onDismiss();
    });
  }, [visible, onDismiss, opacity, translateY, scale, rewardKind]);

  if (!visible) {
    return null;
  }

  const title =
    rewardKind === 'day'
      ? `${petName}'s day is complete`
      : taskLabel
        ? `${petName} · ${taskLabel}`
        : `${petName}'s care task is done`;

  const subtitle =
    rewardKind === 'day'
      ? streakDays > 0
        ? `Streak · ${streakDays} day${streakDays === 1 ? '' : 's'} · +5 care points`
        : 'Streak started · +5 care points'
      : '+1 care point';

  return (
    <Animated.View
      style={[
        styles.wrap,
        shadows.md,
        { opacity, transform: [{ translateY }, { scale }] },
      ]}
    >
      <View style={styles.banner}>
        <View style={styles.iconWell}>
          <MaterialIcon
            name={rewardKind === 'day' ? 'favorite' : 'check'}
            size={20}
            color={rewardKind === 'day' ? colors.accent : colors.success}
          />
        </View>
        <View style={styles.textCol}>
          <AppText
            style={[
              textStyles.body,
              {
                color: colors.text.heading,
                fontFamily: fontFamilies.semibold,
              },
            ]}
            numberOfLines={2}
          >
            {title}
          </AppText>
          <View style={styles.xpChip}>
            <AppText
              style={[
                textStyles.footer,
                {
                  color: colors.accent,
                  fontFamily: fontFamilies.bold,
                },
              ]}
            >
              {subtitle}
            </AppText>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};
