import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../hooks/useTheme';

export type SkeletonProps = {
  width?: number | `${number}%` | 'auto';
  height?: number;
  /** Defaults to theme `radius.md`. Pass `pill` via theme radius or a number. */
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  /** Stagger delay so rows don't pulse in lockstep (ms). */
  delayMs?: number;
  accessibilityLabel?: string;
};

/**
 * Soft opacity pulse for loading placeholders. Prefer this over spinners when
 * layout shape is already known (home dashboard, list rows, cards).
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius,
  style,
  delayMs = 0,
  accessibilityLabel = 'Loading',
}) => {
  const { colors, radius } = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    const startTimer = setTimeout(() => {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    }, delayMs);

    return () => {
      clearTimeout(startTimer);
      loop?.stop();
      opacity.stopAnimation();
    };
  }, [delayMs, opacity]);

  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.bone,
        {
          width,
          height,
          borderRadius: borderRadius ?? radius.md,
          backgroundColor: colors.surfaceAlt,
          opacity,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  bone: {
    overflow: 'hidden',
  },
});
