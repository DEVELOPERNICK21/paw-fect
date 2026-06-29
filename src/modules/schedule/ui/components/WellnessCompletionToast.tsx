import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { useTheme } from '../../../../shared/hooks/useTheme';

export interface WellnessCompletionToastProps {
  visible: boolean;
  petName: string;
  onDismiss: () => void;
}

export const WellnessCompletionToast: React.FC<WellnessCompletionToastProps> = ({
  visible,
  petName,
  onDismiss,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies, shadows } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

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
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.success,
          padding: spacing.md,
        },
      }),
    [colors, radius, spacing],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2800),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      onDismiss();
    });
  }, [visible, onDismiss, opacity]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.wrap, { opacity }, shadows.md]}>
      <View style={styles.banner}>
        <AppText
          style={[
            textStyles.body,
            { color: colors.text.heading, fontFamily: fontFamilies.semibold },
          ]}
        >
          All done for today! {petName} is taken care of 🎉
        </AppText>
      </View>
    </Animated.View>
  );
};
