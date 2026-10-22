import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../AppText';
import { MaterialIcon } from '../MaterialIcon';
import { Mascot } from '../Mascot';
import type { MascotSpecies } from '../Mascot';

export interface BuddyWalkPathProps {
  species: MascotSpecies;
  doneCount: number;
  totalCount: number;
  /** Shown as the walker's progress caption. */
  caption: string;
  paused?: boolean;
  testID?: string;
}

const WALKER = 56;
const END = 40;
const WALK_MS = 1100;

/**
 * Today's walk. The character strolls along a path toward a treat as care tasks
 * get done: each completed task is a step, and finishing the day arrives at the
 * treat. A daily goal you can *see*, with nothing to lose.
 */
export const BuddyWalkPath: React.FC<BuddyWalkPathProps> = ({
  species,
  doneCount,
  totalCount,
  caption,
  paused,
  testID,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies } = useTheme();
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);
  const ratio = totalCount > 0 ? Math.min(doneCount / totalCount, 1) : 0;
  const arrived = totalCount > 0 && doneCount >= totalCount;

  const x = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const tilt = useRef(new Animated.Value(0)).current;
  const first = useRef(true);

  const travel = Math.max(width - WALKER - END, 0);

  useEffect(() => {
    if (width === 0) return;
    const target = ratio * travel;
    if (first.current || reduceMotion) {
      first.current = false;
      x.setValue(target);
      return;
    }
    // Walk: slide to the new spot while bobbing and swaying like a stroll.
    Animated.timing(x, {
      toValue: target,
      duration: WALK_MS,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -5, duration: 140, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 140, useNativeDriver: true }),
      ]),
      { iterations: Math.round(WALK_MS / 280) },
    ).start(() => bob.setValue(0));
    Animated.loop(
      Animated.sequence([
        Animated.timing(tilt, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.timing(tilt, { toValue: -1, duration: 280, useNativeDriver: true }),
        Animated.timing(tilt, { toValue: 0, duration: 140, useNativeDriver: true }),
      ]),
      { iterations: 2 },
    ).start(() => tilt.setValue(0));
  }, [ratio, travel, width, reduceMotion, x, bob, tilt]);

  const stepCount = Math.max(Math.floor(travel / 22), 0);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
          borderWidth: 1,
          borderRadius: radius.xl,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          gap: spacing.xs,
        },
        track: { height: WALKER + 6, justifyContent: 'center' },
        dots: {
          position: 'absolute',
          left: WALKER / 2,
          right: END / 2,
          top: '50%',
          marginTop: 10,
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        dot: { width: 6, height: 6, borderRadius: 3 },
        end: {
          position: 'absolute',
          right: 0,
          top: '50%',
          marginTop: -END / 2,
          width: END,
          height: END,
          borderRadius: END / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: arrived ? colors.primary : colors.brandTint12,
        },
        walker: { position: 'absolute', left: 0, top: 0, width: WALKER, height: WALKER },
      }),
    [colors, radius, spacing, arrived],
  );

  const onLayout = (e: LayoutChangeEvent): void => {
    setWidth(Math.round(e.nativeEvent.layout.width));
  };

  const rotate = tilt.interpolate({ inputRange: [-1, 1], outputRange: ['-5deg', '5deg'] });

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.track} onLayout={onLayout}>
        <View style={styles.dots}>
          {Array.from({ length: stepCount }, (_, i) => {
            const passed = totalCount > 0 && i / Math.max(stepCount - 1, 1) <= ratio;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: passed ? colors.primary : colors.borderSubtle },
                ]}
              />
            );
          })}
        </View>
        <View style={styles.end}>
          <MaterialIcon
            name={arrived ? 'favorite' : 'restaurant'}
            size={20}
            color={arrived ? colors.onAccent : colors.accent}
          />
        </View>
        <Animated.View
          style={[
            styles.walker,
            { transform: [{ translateX: x }, { translateY: bob }, { rotate }] },
          ]}
        >
          <Mascot
            mood={arrived ? 'proud' : 'happy'}
            species={species}
            size={WALKER}
            paused={paused}
            reactionRequest={
              arrived ? { reaction: 'celebrate', id: `walk-arrived-${doneCount}` } : null
            }
          />
        </Animated.View>
      </View>
      <AppText
        style={[
          textStyles.caption,
          { color: colors.text.secondary, fontFamily: fontFamilies.medium },
        ]}
      >
        {caption}
      </AppText>
    </View>
  );
};
