import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { MaterialIcon, type IconName } from '../../../shared/components/MaterialIcon';
import type { SmoothTabGlyph } from './SmoothTabIcon';

export type DelightGlyph = SmoothTabGlyph | 'pets';

type BurstSpec = {
  icon: IconName;
  dx: number;
  dy: number;
  size: number;
  delay: number;
  spin?: number;
};

const BURSTS: Record<DelightGlyph, BurstSpec[]> = {
  favorite: [
    { icon: 'favorite', dx: -14, dy: -22, size: 10, delay: 0 },
    { icon: 'favorite', dx: 12, dy: -26, size: 9, delay: 40 },
    { icon: 'favorite', dx: -4, dy: -32, size: 8, delay: 70 },
    { icon: 'favorite', dx: 18, dy: -14, size: 8, delay: 90 },
    { icon: 'favorite', dx: -18, dy: -10, size: 7, delay: 110 },
  ],
  home: [
    { icon: 'home', dx: -12, dy: -24, size: 9, delay: 0 },
    { icon: 'home', dx: 14, dy: -20, size: 8, delay: 50 },
    { icon: 'home', dx: 0, dy: -30, size: 8, delay: 80 },
    { icon: 'home', dx: 16, dy: -8, size: 7, delay: 100 },
  ],
  wellness: [
    { icon: 'event', dx: -14, dy: -20, size: 10, delay: 0 },
    { icon: 'check', dx: 12, dy: -24, size: 9, delay: 45 },
    { icon: 'event', dx: 0, dy: -30, size: 8, delay: 75 },
    { icon: 'check', dx: 16, dy: -10, size: 8, delay: 100 },
  ],
  settings: [
    { icon: 'settings', dx: -16, dy: -16, size: 10, delay: 0, spin: -90 },
    { icon: 'settings', dx: 14, dy: -20, size: 9, delay: 50, spin: 120 },
    { icon: 'settings', dx: 0, dy: -28, size: 8, delay: 80, spin: 60 },
    { icon: 'settings', dx: 18, dy: -6, size: 8, delay: 110, spin: -45 },
  ],
  // Center paw FAB — paw prints burst in a ring.
  pets: [
    { icon: 'pets', dx: -22, dy: -28, size: 14, delay: 0, spin: -25 },
    { icon: 'pets', dx: 20, dy: -30, size: 13, delay: 35, spin: 30 },
    { icon: 'pets', dx: -28, dy: -8, size: 12, delay: 60, spin: -40 },
    { icon: 'pets', dx: 26, dy: -10, size: 12, delay: 85, spin: 45 },
    { icon: 'pets', dx: -10, dy: -36, size: 11, delay: 100, spin: -15 },
    { icon: 'pets', dx: 8, dy: -38, size: 11, delay: 115, spin: 20 },
    { icon: 'pets', dx: -18, dy: 10, size: 10, delay: 130, spin: -50 },
    { icon: 'pets', dx: 18, dy: 8, size: 10, delay: 145, spin: 55 },
  ],
};

interface TabDelightBurstProps {
  glyph: DelightGlyph;
  /** Fire when this flips true (tab just selected). */
  playToken: number;
  color: string;
}

/**
 * Short-lived micro-particles when a tab / FAB is selected.
 * One-shot (~700ms), then idle — does not loop.
 */
export const TabDelightBurst: React.FC<TabDelightBurstProps> = ({
  glyph,
  playToken,
  color,
}) => {
  const specs = BURSTS[glyph];
  const progresses = useMemo(
    () => specs.map(() => new Animated.Value(0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [glyph],
  );
  const lastToken = useRef(0);

  useEffect(() => {
    if (typeof jest !== 'undefined') {
      return;
    }
    if (playToken <= 0 || playToken === lastToken.current) {
      return;
    }
    lastToken.current = playToken;

    progresses.forEach(p => p.setValue(0));
    Animated.stagger(
      24,
      progresses.map((progress, index) =>
        Animated.timing(progress, {
          toValue: 1,
          duration: glyph === 'pets' ? 720 : 640,
          delay: specs[index]?.delay ?? 0,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [glyph, playToken, progresses, specs]);

  return (
    <View pointerEvents="none" style={styles.layer}>
      {specs.map((spec, index) => {
        const progress = progresses[index];
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, spec.dx],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, spec.dy],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.12, 0.65, 1],
          outputRange: [0, 1, 0.9, 0],
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.22, 1],
          outputRange: [0.3, 1.2, 0.65],
        });
        const rotate = progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${spec.spin ?? 0}deg`],
        });

        return (
          <Animated.View
            key={`${glyph}-${index}`}
            style={[
              styles.particle,
              {
                opacity,
                transform: [
                  { translateX },
                  { translateY },
                  { scale },
                  { rotate },
                ],
              },
            ]}
          >
            <MaterialIcon name={spec.icon} size={spec.size} color={color} />
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 4,
  },
  particle: {
    position: 'absolute',
  },
});
