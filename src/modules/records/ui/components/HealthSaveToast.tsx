import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';

export interface HealthSaveToastProps {
  visible: boolean;
  message: string;
  bottomInset?: number;
  onDismiss: () => void;
}

/**
 * Lightweight slide-up toast for Health saves — no modal overlay.
 * Matches Care completion toast language (fade + auto-dismiss).
 */
export const HealthSaveToast: React.FC<HealthSaveToastProps> = ({
  visible,
  message,
  bottomInset = 0,
  onDismiss,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies, shadows } =
    useTheme();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          position: 'absolute',
          left: spacing.lg,
          right: spacing.lg,
          bottom: Math.max(bottomInset, insets.bottom) + spacing.md,
          zIndex: 30,
        },
        banner: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          borderRadius: radius.xl,
          // Solid surface so text stays readable over scrolling content
          // (dark successSurface is translucent).
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.success,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          overflow: 'hidden',
        },
        accentBar: {
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: colors.success,
        },
        iconBubble: {
          width: 32,
          height: 32,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.round,
          backgroundColor: colors.successSurface,
        },
        copy: {
          flex: 1,
          minWidth: 0,
          gap: spacing.xxs,
        },
      }),
    [bottomInset, colors, insets.bottom, radius, spacing],
  );

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      translateY.setValue(16);
      return;
    }

    opacity.setValue(0);
    translateY.setValue(16);

    const animation = Animated.sequence([
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
      ]),
      Animated.delay(2200),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 12,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        onDismiss();
      }
    });

    return () => {
      animation.stop();
    };
  }, [visible, onDismiss, opacity, translateY]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        shadows.md,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.banner}>
        <View style={styles.accentBar} />
        <View style={styles.iconBubble}>
          <MaterialIcon name="check" size={18} color={colors.success} />
        </View>
        <View style={styles.copy}>
          <AppText
            style={[
              textStyles.caption,
              {
                color: colors.text.heading,
                fontFamily: fontFamilies.bold,
              },
            ]}
          >
            Saved
          </AppText>
          <AppText
            style={[textStyles.footer, { color: colors.text.secondary }]}
            numberOfLines={2}
          >
            {message}
          </AppText>
        </View>
      </View>
    </Animated.View>
  );
};
