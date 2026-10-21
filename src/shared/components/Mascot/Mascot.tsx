import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg from 'react-native-svg';

import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useTheme } from '../../hooks/useTheme';
import { MascotArt } from './MascotArt';
import { ExtrasPart } from './mascotParts';
import { rigNodesFor } from './rigParts';
import { RiveMascot } from './RiveMascot';
import { MASCOT_RIVE_SOURCE } from './mascotRiveSource';
import { CANVAS, MOOD_MOTION, MOOD_POSE, pivotsFor } from './mascotRig';
import type { MascotMood, MascotSpecies } from './mascotTypes';

export interface MascotProps {
  mood: MascotMood;
  species?: MascotSpecies;
  size?: number;
  /** When set the mascot reacts to a tap (squish + wink) and calls this. */
  onPress?: () => void;
  /** Mascots are decorative by default; pass a label only when it carries meaning. */
  accessibilityLabel?: string;
  /** Turn off all motion (e.g. inside a list). Reduce Motion also disables it. */
  animated?: boolean;
  testID?: string;
}

const BLINK_MIN_MS = 2800;
const BLINK_SPREAD_MS = 2600;
const BLINK_HOLD_MS = 130;
const WINK_HOLD_MS = 800;

type Pivot = { x: number; y: number };

/** Offset of a canvas point from the layer centre, in pixels. */
const offset = (size: number, p: Pivot): { ox: number; oy: number } => ({
  ox: (p.x / CANVAS) * size - size / 2,
  oy: (p.y / CANVAS) * size - size / 2,
});

const timing = (value: Animated.Value, toValue: number, duration: number): Animated.CompositeAnimation =>
  Animated.timing(value, {
    toValue,
    duration,
    easing: Easing.inOut(Easing.quad),
    useNativeDriver: true,
  });

/** One rig layer: a full-size animated box holding a single part's art. */
const RigLayer: React.FC<{
  size: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}> = ({ size, style, children }) => (
  <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, style]}>
    {children}
  </Animated.View>
);

const Art: React.FC<{ size: number; defs?: React.ReactNode; children: React.ReactNode }> = ({ size, defs, children }) => (
  <Svg width={size} height={size} viewBox={`0 0 ${CANVAS} ${CANVAS}`}>
    {defs}
    {children}
  </Svg>
);

/**
 * Friendly pet-parent mascot, built as a layered rig (tail, body, collar tag,
 * head, ears, face, raised paw) so each part animates on its own with the native
 * driver. Props (`mood`, `species`) are the stable contract the final illustrated
 * Rive/Lottie version will honour.
 */
const SvgMascot: React.FC<MascotProps> = ({
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

  const tail = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const wave = useRef(new Animated.Value(0)).current;
  const tag = useRef(new Animated.Value(0)).current;
  const earL = useRef(new Animated.Value(0)).current;
  const earR = useRef(new Animated.Value(0)).current;
  const squish = useRef(new Animated.Value(1)).current;
  const [blink, setBlink] = useState(false);
  const [wink, setWink] = useState(false);

  const m = MOOD_MOTION[mood];
  const pose = MOOD_POSE[mood];
  const PIVOT = pivotsFor(species);
  const nodes = useMemo(() => rigNodesFor(species, mood, blink, wink), [species, mood, blink, wink]);

  // continuous loops (tail wag, breathing, tag swing, hop, head sway, wave)
  useEffect(() => {
    [tail, breath, hop, sway, wave, tag].forEach(v => v.setValue(0));
    if (!motion) {
      return undefined;
    }
    const loops: Animated.CompositeAnimation[] = [];
    const loop = (anim: Animated.CompositeAnimation): void => {
      const l = Animated.loop(anim);
      loops.push(l);
      l.start();
    };
    if (m.tailMs > 0) {
      loop(Animated.sequence([timing(tail, 1, m.tailMs), timing(tail, -1, m.tailMs)]));
    }
    loop(Animated.sequence([timing(breath, 1, m.breathMs), timing(breath, 0, m.breathMs)]));
    loop(Animated.sequence([timing(tag, 1, 900), timing(tag, -1, 900)]));
    if (m.hop > 0) {
      loop(Animated.sequence([timing(hop, 1, m.breathMs), timing(hop, 0, m.breathMs)]));
    }
    if (m.sway > 0) {
      loop(Animated.sequence([timing(sway, 1, 900), timing(sway, -1, 900)]));
    }
    if (m.waveDeg > 0) {
      loop(Animated.sequence([timing(wave, 1, 330), timing(wave, -1, 330)]));
    }
    return () => loops.forEach(l => l.stop());
  }, [mood, motion, m, tail, breath, hop, sway, wave, tag]);

  // occasional blink + ear flick while idle
  useEffect(() => {
    if (!motion || !m.idleLife) {
      setBlink(false);
      return undefined;
    }
    let cancelled = false;
    let blinkTimer: ReturnType<typeof setTimeout>;
    let earTimer: ReturnType<typeof setTimeout>;
    const scheduleBlink = (): void => {
      blinkTimer = setTimeout(() => {
        if (cancelled) return;
        setBlink(true);
        blinkTimer = setTimeout(() => {
          if (cancelled) return;
          setBlink(false);
          scheduleBlink();
        }, BLINK_HOLD_MS);
      }, BLINK_MIN_MS + Math.random() * BLINK_SPREAD_MS);
    };
    const scheduleEar = (): void => {
      earTimer = setTimeout(() => {
        if (cancelled) return;
        const target = Math.random() < 0.5 ? earL : earR;
        Animated.sequence([timing(target, 1, 110), Animated.spring(target, { toValue: 0, friction: 4, tension: 180, useNativeDriver: true })]).start();
        scheduleEar();
      }, 3500 + Math.random() * 3500);
    };
    scheduleBlink();
    scheduleEar();
    return () => {
      cancelled = true;
      clearTimeout(blinkTimer);
      clearTimeout(earTimer);
    };
  }, [mood, motion, m.idleLife, earL, earR]);

  useEffect(() => {
    if (!wink) {
      return undefined;
    }
    const t = setTimeout(() => setWink(false), WINK_HOLD_MS);
    return () => clearTimeout(t);
  }, [wink]);

  const handlePress = useCallback(() => {
    if (motion) {
      setWink(true);
      Animated.sequence([
        Animated.timing(squish, { toValue: 0.92, duration: 90, useNativeDriver: true }),
        Animated.spring(squish, { toValue: 1, friction: 3, tension: 170, useNativeDriver: true }),
      ]).start();
    }
    onPress?.();
  }, [motion, onPress, squish]);

  const rig = useMemo(() => {
    const deg = (v: Animated.Value, amp: number): Animated.AnimatedInterpolation<string> =>
      v.interpolate({ inputRange: [-1, 1], outputRange: [`${-amp}deg`, `${amp}deg`] });
    const pivotRotate = (p: Pivot, rotate: Animated.AnimatedInterpolation<string>): ViewStyle['transform'] => {
      const { ox, oy } = offset(size, p);
      return [{ translateX: ox }, { translateY: oy }, { rotate }, { translateX: -ox }, { translateY: -oy }] as unknown as ViewStyle['transform'];
    };

    const bodyOy = offset(size, PIVOT.bodyBase).oy;
    const bodyStyle = {
      transform: [
        { translateY: bodyOy },
        { scaleY: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + m.breathAmp] }) },
        { translateY: -bodyOy },
      ],
    } as unknown as ViewStyle;

    const headLift = breath.interpolate({ inputRange: [0, 1], outputRange: [0, -size * m.breathAmp * 2.2] });
    const headTilt = sway.interpolate({ inputRange: [-1, 1], outputRange: [`${pose.headTilt - m.sway}deg`, `${pose.headTilt + m.sway}deg`] });
    const headOffset = offset(size, PIVOT.head);
    const headStyle = {
      transform: [
        { translateY: headLift },
        { translateX: headOffset.ox },
        { translateY: headOffset.oy },
        { rotate: headTilt },
        { translateX: -headOffset.ox },
        { translateY: -headOffset.oy },
      ],
    } as unknown as ViewStyle;

    const hopStyle = {
      transform: [{ translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -size * m.hop] }) }, { scale: squish }],
    } as unknown as ViewStyle;

    const tailStyle = { transform: pivotRotate(PIVOT.tail, deg(tail, m.tailDeg)) } as ViewStyle;
    const tagStyle = { transform: pivotRotate(PIVOT.tag, deg(tag, 6)) } as ViewStyle;
    const earLStyle = {
      transform: pivotRotate(PIVOT.earL, earL.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-14deg'] })),
    } as ViewStyle;
    const earRStyle = {
      transform: pivotRotate(PIVOT.earR, earR.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '14deg'] })),
    } as ViewStyle;
    const armStyle = {
      transform: pivotRotate(PIVOT.arm, wave.interpolate({ inputRange: [-1, 1], outputRange: [`${-m.waveDeg}deg`, `${m.waveDeg}deg`] })),
    } as ViewStyle;
    return { bodyStyle, headStyle, hopStyle, tailStyle, tagStyle, earLStyle, earRStyle, armStyle };
  }, [size, m, pose.headTilt, breath, sway, hop, squish, tail, tag, earL, earR, wave, PIVOT]);

  const styles = useMemo(() => StyleSheet.create({ box: { width: size, height: size } }), [size]);

  const layer = (node: React.ReactNode, style?: StyleProp<ViewStyle>): React.ReactElement => (
    <RigLayer size={size} style={style}>
      <Art size={size} defs={nodes.defs}>
        {node}
      </Art>
    </RigLayer>
  );

  const character = motion ? (
    <View style={styles.box}>
      {layer(nodes.shadow)}
      <RigLayer size={size} style={rig.hopStyle}>
        {layer(nodes.tail, rig.tailStyle)}
        <RigLayer size={size} style={rig.bodyStyle}>
          {layer(nodes.body)}
          {layer(nodes.tag, rig.tagStyle)}
        </RigLayer>
        <RigLayer size={size} style={rig.headStyle}>
          {layer(nodes.earL, rig.earLStyle)}
          {layer(nodes.earR, rig.earRStyle)}
          {layer(nodes.headBase)}
          {layer(nodes.face)}
        </RigLayer>
        {mood === 'wave' ? layer(nodes.arm, rig.armStyle) : null}
        {layer(<ExtrasPart mood={mood} secondary={colors.text.secondary} />)}
      </RigLayer>
    </View>
  ) : (
    <View style={styles.box}>
      <MascotArt species={species} mood={mood} colors={colors} size={size} />
    </View>
  );

  if (onPress) {
    return (
      <Pressable testID={testID} onPress={handlePress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? 'Pet mascot'}>
        {character}
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
      {character}
    </View>
  );
};

/**
 * Public mascot. Plays the designer-made Rive file when one is configured for
 * this species (and Reduce Motion is off); otherwise, or if Rive fails to load,
 * it falls back to the code-drawn layered mascot above.
 */
export const Mascot: React.FC<MascotProps> = props => {
  const species = props.species ?? 'dog';
  const source = MASCOT_RIVE_SOURCE[species];
  const reduceMotion = useReduceMotion();
  const [riveFailed, setRiveFailed] = useState(false);
  const onFailed = useCallback(() => setRiveFailed(true), []);

  const useRive = source != null && !riveFailed && !reduceMotion && props.animated !== false;
  if (useRive && source != null) {
    return (
      <RiveMascot
        source={source}
        mood={props.mood}
        size={props.size ?? 96}
        onPress={props.onPress}
        onFailed={onFailed}
        accessibilityLabel={props.accessibilityLabel}
        testID={props.testID}
      />
    );
  }
  return <SvgMascot {...props} />;
};
