import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useTheme } from '../../../../shared/hooks/useTheme';

export interface CareDoneBurstProps {
  visible: boolean;
  /** Stronger burst for day-complete celebrations. */
  intensity?: 'soft' | 'day';
}

const SOFT_COUNT = 8;
const DAY_COUNT = 14;

/**
 * Soft brand-colored particle burst on Done — celebration without confetti spam.
 */
export const CareDoneBurst: React.FC<CareDoneBurstProps> = ({
  visible,
  intensity = 'soft',
}) => {
  const { colors } = useTheme();
  const count = intensity === 'day' ? DAY_COUNT : SOFT_COUNT;
  const anims = useRef(
    Array.from({ length: DAY_COUNT }, () => new Animated.Value(0)),
  ).current;

  const particleColors = useMemo(
    () => [colors.accent, colors.primaryLight, colors.success, colors.warning],
    [colors],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    anims.forEach(anim => anim.setValue(0));
    Animated.stagger(
      18,
      anims.slice(0, count).map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: intensity === 'day' ? 620 : 480,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [visible, anims, count, intensity]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.wrap} pointerEvents="none">
      {anims.slice(0, count).map((anim, index) => {
        const angle = (index / count) * Math.PI * 2;
        const dist = intensity === 'day' ? 56 + (index % 4) * 10 : 36 + (index % 3) * 8;
        const translateX = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(angle) * dist],
        });
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(angle) * dist - 12],
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.65, 1],
          outputRange: [1, 1, 0],
        });
        const scale = anim.interpolate({
          inputRange: [0, 0.35, 1],
          outputRange: [0.4, 1.1, 0.6],
        });
        return (
          <Animated.View
            key={`burst-${index}`}
            style={[
              styles.particle,
              {
                backgroundColor: particleColors[index % particleColors.length],
                opacity,
                transform: [{ translateX }, { translateY }, { scale }],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 18,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
