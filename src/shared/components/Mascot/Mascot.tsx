import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useTheme } from '../../hooks/useTheme';
import { MascotArt } from './MascotArt';
import type { MascotMood, MascotSpecies } from './mascotTypes';

export interface MascotProps {
  mood: MascotMood;
  species?: MascotSpecies;
  size?: number;
  /** When set the mascot reacts to a tap (squish + bounce) and calls this. */
  onPress?: () => void;
  /** Mascots are decorative by default; pass a label only when it carries meaning. */
  accessibilityLabel?: string;
  /** Turn off idle motion (e.g. inside a list). Reduce Motion also disables it. */
  animated?: boolean;
  testID?: string;
}

const BLINK_MIN_MS = 2800;
const BLINK_SPREAD_MS = 2400;
const BLINK_HOLD_MS = 140;
const BLINK_MOODS: readonly MascotMood[] = ['happy', 'wave', 'curious', 'nudge', 'thinking'];

const TILT_BY_MOOD: Partial<Record<MascotMood, number>> = { curious: -8, nudge: 4 };

function idleLoop(mood: MascotMood, bob: Animated.Value, sway: Animated.Value): Animated.CompositeAnimation {
  const timing = (value: Animated.Value, to: number, duration: number): Animated.CompositeAnimation =>
    Animated.timing(value, {
      toValue: to,
      duration,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });

  switch (mood) {
    case 'celebrating':
      return Animated.loop(
        Animated.sequence([timing(bob, -10, 380), timing(bob, 0, 380), timing(bob, -4, 220), timing(bob, 0, 220)]),
      );
    case 'sleepy':
      return Animated.loop(Animated.sequence([timing(bob, -1.5, 1800), timing(bob, 0, 1800)]));
    case 'thinking':
      return Animated.loop(Animated.sequence([timing(sway, 1, 900), timing(sway, -1, 900)]));
    case 'wave':
      return Animated.loop(Animated.sequence([timing(sway, 1, 450), timing(sway, -1, 450)]));
    default:
      return Animated.loop(Animated.sequence([timing(bob, -3, 1200), timing(bob, 0, 1200)]));
  }
}

/**
 * Friendly pet-parent mascot. Placeholder art today; the props (`mood`,
 * `species`) are the stable contract the Rive/Lottie version will honour.
 */
export const Mascot: React.FC<MascotProps> = ({
  mood,
  species = 'dog',
  size = 96,
  onPress,
  accessibilityLabel,
  animated = true,
  testID,
}) => {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const motion = animated && !reduceMotion;

  const bob = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const squish = useRef(new Animated.Value(1)).current;
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    bob.setValue(0);
    sway.setValue(0);
    if (!motion) {
      return undefined;
    }
    const loop = idleLoop(mood, bob, sway);
    loop.start();
    return () => loop.stop();
  }, [mood, motion, bob, sway]);

  useEffect(() => {
    if (!motion || !BLINK_MOODS.includes(mood)) {
      setBlink(false);
      return undefined;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (): void => {
      timer = setTimeout(() => {
        if (cancelled) {
          return;
        }
        setBlink(true);
        timer = setTimeout(() => {
          if (cancelled) {
            return;
          }
          setBlink(false);
          schedule();
        }, BLINK_HOLD_MS);
      }, BLINK_MIN_MS + Math.random() * BLINK_SPREAD_MS);
    };
    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mood, motion]);

  const handlePress = useCallback(() => {
    if (motion) {
      Animated.sequence([
        Animated.timing(squish, { toValue: 0.9, duration: 90, useNativeDriver: true }),
        Animated.spring(squish, { toValue: 1, friction: 3, tension: 160, useNativeDriver: true }),
      ]).start();
    }
    onPress?.();
  }, [motion, onPress, squish]);

  const styles = useMemo(() => StyleSheet.create({ box: { width: size, height: size } }), [size]);

  const rotate = sway.interpolate({ inputRange: [-1, 1], outputRange: ['-4deg', '4deg'] });
  const tilt = `${TILT_BY_MOOD[mood] ?? 0}deg`;

  const art = (
    <Animated.View
      style={[
        styles.box,
        { transform: [{ translateY: bob }, { rotate: tilt }, { rotate }, { scale: squish }] },
      ]}
    >
      <MascotArt species={species} mood={mood} colors={colors} size={size} blink={blink} />
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? 'Pet mascot'}
      >
        {art}
      </Pressable>
    );
  }

  const decorative = accessibilityLabel == null;
  return (
    <View
      testID={testID}
      accessible={!decorative}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
      accessibilityElementsHidden={decorative}
    >
      {art}
    </View>
  );
};
