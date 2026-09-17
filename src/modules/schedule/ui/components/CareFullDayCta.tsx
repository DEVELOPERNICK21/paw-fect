import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';

export interface CareFullDayCtaProps {
  doneCount: number;
  totalCount: number;
  onPress: () => void;
}

/**
 * Primary entry into the full-day care path — easy to spot and tap.
 */
export const CareFullDayCta: React.FC<CareFullDayCtaProps> = ({
  doneCount,
  totalCount,
  onPress,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies, shadows } =
    useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: radius.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.brandTint20,
        },
        inner: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.lg,
        },
        iconWell: {
          width: 48,
          height: 48,
          borderRadius: radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.brandTint12,
        },
        textCol: { flex: 1, minWidth: 0, gap: 2 },
        chevron: {
          width: 32,
          height: 32,
          borderRadius: radius.round,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accent,
        },
      }),
    [colors, radius, spacing],
  );

  const remaining = Math.max(totalCount - doneCount, 0);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="See full day care path"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadows.md,
        { opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] },
      ]}
    >
      <LinearGradient
        colors={[colors.brandTint12, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.inner}
      >
        <View style={styles.iconWell}>
          <MaterialIcon name="map" size={24} color={colors.accent} />
        </View>
        <View style={styles.textCol}>
          <AppText
            style={[
              textStyles.subtitle,
              {
                color: colors.text.heading,
                fontFamily: fontFamilies.extrabold,
                letterSpacing: -0.2,
              },
            ]}
          >
            See full day
          </AppText>
          <AppText
            style={[
              textStyles.caption,
              {
                color: colors.text.secondary,
                fontFamily: fontFamilies.medium,
                fontVariant: ['tabular-nums'],
              },
            ]}
          >
            {remaining > 0
              ? `${remaining} stop${remaining === 1 ? '' : 's'} left on today's path`
              : totalCount > 0
                ? 'All stops complete — review the path'
                : 'Open today\'s care path'}
          </AppText>
        </View>
        <View style={styles.chevron}>
          <MaterialIcon
            name="arrow_forward"
            size={18}
            color={colors.onAccent}
          />
        </View>
      </LinearGradient>
    </Pressable>
  );
};
