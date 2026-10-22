import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../AppText';
import { Mascot } from '../Mascot';
import type {
  MascotHandle,
  MascotMood,
  MascotReactionRequest,
  MascotSpecies,
} from '../Mascot';

export interface CompanionBubbleProps {
  species: MascotSpecies;
  mood: MascotMood;
  /** First line is primary; a tap cycles through the rest. */
  lines: string[];
  size?: number;
  /** Reactions (celebrate, success...) are played through this handle. */
  mascotRef?: React.Ref<MascotHandle>;
  reactionRequest?: MascotReactionRequest | null;
  paused?: boolean;
  testID?: string;
}

/**
 * The app's character, speaking. The mascot and a speech bubble form one
 * element so the character always has something to say. Tapping pets the
 * character and brings up its next line.
 */
export const CompanionBubble: React.FC<CompanionBubbleProps> = ({
  species,
  mood,
  lines,
  size = 76,
  mascotRef,
  reactionRequest,
  paused,
  testID,
}) => {
  const { colors, textStyles, fontFamilies, radius, spacing } = useTheme();
  const reduceMotion = useReduceMotion();
  const [index, setIndex] = useState(0);
  const pop = useRef(new Animated.Value(1)).current;

  const primary = lines[0] ?? '';
  // A new primary line (the situation changed) resets to it.
  useEffect(() => {
    setIndex(0);
  }, [primary]);

  const line = lines[index % Math.max(lines.length, 1)] ?? '';

  useEffect(() => {
    if (reduceMotion) return;
    pop.setValue(0.94);
    Animated.spring(pop, {
      toValue: 1,
      friction: 6,
      tension: 180,
      useNativeDriver: true,
    }).start();
  }, [line, pop, reduceMotion]);

  const onPressMascot = useCallback(() => {
    if (lines.length > 1) {
      setIndex(i => (i + 1) % lines.length);
    }
  }, [lines.length]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
        mascot: { width: size, height: size },
        bubbleWrap: { flex: 1 },
        bubble: {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
          borderWidth: 1,
          borderRadius: radius.xl,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
        },
        tail: {
          position: 'absolute',
          left: -6,
          top: '50%',
          marginTop: -6,
          width: 12,
          height: 12,
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
          borderLeftWidth: 1,
          borderBottomWidth: 1,
          transform: [{ rotate: '45deg' }],
        },
      }),
    [colors, radius, spacing, size],
  );

  return (
    <View style={styles.row} testID={testID}>
      <View style={styles.mascot}>
        <Mascot
          ref={mascotRef}
          mood={mood}
          species={species}
          size={size}
          interactive
          onPress={onPressMascot}
          paused={paused}
          reactionRequest={reactionRequest}
        />
      </View>
      <Animated.View style={[styles.bubbleWrap, { transform: [{ scale: pop }] }]}>
        <View style={styles.tail} />
        <Pressable
          onPress={onPressMascot}
          accessibilityRole="text"
          accessibilityLabel={line}
          style={styles.bubble}
        >
          <AppText
            style={[
              textStyles.body,
              { color: colors.text.heading, fontFamily: fontFamilies.medium },
            ]}
          >
            {line}
          </AppText>
        </Pressable>
      </Animated.View>
    </View>
  );
};
