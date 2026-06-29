import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useTheme } from '../../../../shared/hooks/useTheme';

export interface WellnessConfettiBurstProps {
  visible: boolean;
}

const PARTICLE_COUNT = 10;

export const WellnessConfettiBurst: React.FC<WellnessConfettiBurstProps> = ({ visible }) => {
  const { colors } = useTheme();
  const anims = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0)),
  ).current;

  const particleColors = useMemo(
    () => [colors.primary, colors.success, colors.warning, colors.accent],
    [colors],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    anims.forEach(anim => anim.setValue(0));
    Animated.stagger(
      20,
      anims.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [visible, anims]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.wrap} pointerEvents="none">
      {anims.map((anim, index) => {
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -40 - (index % 3) * 12],
        });
        const translateX = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, (index % 2 === 0 ? 1 : -1) * (20 + index * 4)],
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [1, 1, 0],
        });
        return (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                backgroundColor: particleColors[index % particleColors.length],
                opacity,
                transform: [{ translateY }, { translateX }],
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
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 19,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
