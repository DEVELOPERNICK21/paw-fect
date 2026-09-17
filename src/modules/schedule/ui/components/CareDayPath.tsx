import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { Paw3dIcon } from '../../../../shared/components/Paw3dIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { resolvePetAvatarSource } from '../../../../shared/utils/petDisplayPhoto';
import type { CareAggregatedItem } from '../../domain/utils/careAggregator';
import { careTaskShortVerb } from '../../domain/utils/careTaskCopy';
import { careCategoryIcon } from '../utils/careCategoryIcon';

export interface CareDayPathProps {
  items: CareAggregatedItem[];
  onSelect: (item: CareAggregatedItem) => void;
  onMarkDone?: (item: CareAggregatedItem) => void;
}

type StopState = 'done' | 'here' | 'upcoming' | 'skipped';

const NODE = 58;
const ROW = 118;
const TOP_PAD = 64;
const BOTTOM_PAD = 36;
const CHIP_W = 132;

function resolveStopState(
  item: CareAggregatedItem,
  hereBlockId: string | null,
): StopState {
  if (item.urgency === 'done') {
    return 'done';
  }
  if (item.urgency === 'skipped') {
    return 'skipped';
  }
  if (hereBlockId != null && item.block.id === hereBlockId) {
    return 'here';
  }
  return 'upcoming';
}

/** Zigzag lanes like a casual game map (L → C → R → C…). */
function laneFraction(index: number): number {
  const pattern = [0.24, 0.5, 0.76, 0.5];
  return pattern[index % pattern.length];
}

function laneSide(index: number): 'left' | 'center' | 'right' {
  const pattern: Array<'left' | 'center' | 'right'> = [
    'left',
    'center',
    'right',
    'center',
  ];
  return pattern[index % pattern.length];
}

function nodeCenter(
  index: number,
  boardWidth: number,
): { x: number; y: number } {
  return {
    x: boardWidth * laneFraction(index),
    y: TOP_PAD + index * ROW + NODE / 2,
  };
}

function buildTrailPath(count: number, boardWidth: number): string {
  if (count === 0) {
    return '';
  }
  const points = Array.from({ length: count }, (_, i) =>
    nodeCenter(i, boardWidth),
  );
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const midY = (prev.y + curr.y) / 2;
    d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
  }
  return d;
}

type DayNightSkyProps = {
  width: number;
  height: number;
  isDark: boolean;
};

/**
 * Explicit day → night theme for the care path.
 * Top = morning · mid = day · lower = dusk · bottom = night.
 */
const DayNightSky: React.FC<DayNightSkyProps> = ({ width, height, isDark }) => {
  const starTwinkle = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(starTwinkle, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(starTwinkle, {
          toValue: 0.35,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [starTwinkle]);

  // Clear sky bands — readable without competing with chips.
  const skyColors = isDark
    ? ['#5A4A3A', '#3D4558', '#2A3348', '#171E30', '#0A0F1C']
    : ['#FFD9A8', '#B8D9F5', '#8EB8E8', '#5A6F9A', '#1A2440'];

  const stars = useMemo(
    () =>
      [
        [0.1, 0.68],
        [0.2, 0.74],
        [0.32, 0.7],
        [0.45, 0.78],
        [0.58, 0.72],
        [0.7, 0.8],
        [0.82, 0.7],
        [0.9, 0.76],
        [0.15, 0.86],
        [0.4, 0.9],
        [0.65, 0.88],
        [0.85, 0.92],
        [0.28, 0.95],
        [0.52, 0.96],
      ] as const,
    [],
  );

  const bandH = height;
  const labels: Array<{ y: number; text: string }> = [
    { y: bandH * 0.06, text: 'Morning' },
    { y: bandH * 0.32, text: 'Afternoon' },
    { y: bandH * 0.58, text: 'Evening' },
    { y: bandH * 0.84, text: 'Night' },
  ];

  return (
    <>
      <LinearGradient
        colors={skyColors}
        locations={[0, 0.2, 0.45, 0.7, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}
      />

      {/* Warm morning glow */}
      <LinearGradient
        colors={[
          isDark ? 'rgba(255,180,100,0.22)' : 'rgba(255,210,140,0.55)',
          'transparent',
        ]}
        start={{ x: 0.8, y: 0 }}
        end={{ x: 0.3, y: 0.35 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: height * 0.35,
        }}
        pointerEvents="none"
      />

      {/* Cool night wash */}
      <LinearGradient
        colors={[
          'transparent',
          isDark ? 'rgba(8,12,24,0.55)' : 'rgba(20,30,60,0.45)',
        ]}
        start={{ x: 0.5, y: 0.55 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          top: height * 0.5,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        pointerEvents="none"
      />

      <Svg
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Sun — morning */}
        <Circle
          cx={width * 0.82}
          cy={height * 0.09}
          r={Math.min(width * 0.16, 52)}
          fill="#FFB347"
          opacity={isDark ? 0.2 : 0.4}
        />
        <Circle
          cx={width * 0.82}
          cy={height * 0.09}
          r={Math.min(width * 0.09, 30)}
          fill="#FFE0A0"
          opacity={isDark ? 0.35 : 0.75}
        />
        {/* Soft dusk orb */}
        <Circle
          cx={width * 0.88}
          cy={height * 0.52}
          r={Math.min(width * 0.1, 34)}
          fill="#FF8C5A"
          opacity={isDark ? 0.12 : 0.22}
        />
        {/* Moon — night */}
        <Circle
          cx={width * 0.16}
          cy={height * 0.8}
          r={Math.min(width * 0.08, 28)}
          fill="#F0F4FF"
          opacity={isDark ? 0.55 : 0.7}
        />
        <Circle
          cx={width * 0.185}
          cy={height * 0.785}
          r={Math.min(width * 0.06, 22)}
          fill={isDark ? '#0A0F1C' : '#1A2440'}
          opacity={0.65}
        />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: starTwinkle,
        }}
      >
        <Svg width={width} height={height}>
          {stars.map(([fx, fy], i) => (
            <Circle
              key={`star-${i}`}
              cx={width * fx}
              cy={height * fy}
              r={i % 3 === 0 ? 1.8 : 1.15}
              fill="#FFFFFF"
              opacity={0.55 + (i % 4) * 0.1}
            />
          ))}
        </Svg>
      </Animated.View>

      {/* Quiet period labels — guide the day→night read */}
      {labels.map(label => (
        <View
          key={label.text}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 10,
            top: label.y,
          }}
        >
          <AppText
            style={{
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              color: isDark
                ? 'rgba(255,255,255,0.28)'
                : label.y > height * 0.55
                  ? 'rgba(255,255,255,0.45)'
                  : 'rgba(30,40,70,0.35)',
              fontWeight: '700',
            }}
          >
            {label.text}
          </AppText>
        </View>
      ))}
    </>
  );
};

type MapNodeProps = {
  item: CareAggregatedItem;
  index: number;
  state: StopState;
  boardWidth: number;
  onPress: () => void;
  enterDelay: number;
};

const MapNode: React.FC<MapNodeProps> = ({
  item,
  index,
  state,
  boardWidth,
  onPress,
  enterDelay,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies, shadows } =
    useTheme();
  const enter = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 320,
      delay: enterDelay,
      useNativeDriver: true,
    }).start();
  }, [enter, enterDelay]);

  const center = nodeCenter(index, boardWidth);
  const side = laneSide(index);
  const what = careTaskShortVerb(item.block);
  const isDone = state === 'done';
  const isHere = state === 'here';
  const isUpcoming = state === 'upcoming' || state === 'skipped';

  const fill = isDone
    ? colors.success
    : isHere
      ? colors.accent
      : colors.surface;
  const rim = isDone
    ? colors.success
    : isHere
      ? colors.primaryDark
      : colors.borderSubtle;

  /** Context chip sits toward the open side of the map. */
  const chipLeft =
    side === 'left'
      ? center.x + NODE / 2 + 8
      : side === 'right'
        ? center.x - NODE / 2 - CHIP_W - 8
        : index % 8 < 4
          ? center.x + NODE / 2 + 8
          : center.x - NODE / 2 - CHIP_W - 8;

  const chipTop = center.y - 28;

  return (
    <>
      <Animated.View
        style={[
          styles.nodeAbs,
          {
            left: center.x - NODE / 2,
            top: center.y - NODE / 2,
            opacity: enter,
            transform: [
              {
                scale: enter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1],
                }),
              },
              { scale: press },
              {
                translateY: enter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Stop ${index + 1}, ${item.pet.name}, ${what}, ${item.whenLabel}`}
          onPress={onPress}
          onPressIn={() =>
            Animated.timing(press, {
              toValue: 0.92,
              duration: 90,
              useNativeDriver: true,
            }).start()
          }
          onPressOut={() =>
            Animated.timing(press, {
              toValue: 1,
              duration: 120,
              useNativeDriver: true,
            }).start()
          }
          style={[
            styles.nodeBtn,
            shadows.md,
            {
              backgroundColor: fill,
              borderColor: rim,
              opacity: isUpcoming && !isHere ? 0.78 : 1,
            },
          ]}
        >
          {isDone ? (
            <MaterialIcon name="check" size={24} color={colors.onAccent} />
          ) : (
            <MaterialIcon
              name={careCategoryIcon(item.block.category)}
              size={22}
              color={isHere ? colors.onAccent : colors.text.secondary}
            />
          )}
        </Pressable>
        <AppText
          style={[
            textStyles.footer,
            styles.nodeIndex,
            {
              color: isHere ? colors.accent : colors.text.secondary,
              fontFamily: isHere ? fontFamilies.bold : fontFamilies.medium,
              fontVariant: ['tabular-nums'],
            },
          ]}
        >
          {index + 1}
        </AppText>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.chipAbs,
          shadows.sm,
          {
            left: Math.max(6, Math.min(chipLeft, boardWidth - CHIP_W - 6)),
            top: chipTop,
            width: CHIP_W,
            opacity: enter,
            borderColor: isHere
              ? colors.accent
              : isDone
                ? colors.success
                : colors.borderSubtle,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            transform: [
              {
                translateY: enter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.chipRow}>
          <Image
            source={resolvePetAvatarSource(item.pet)}
            style={styles.chipAvatar}
          />
          <View style={styles.chipMeta}>
            <AppText
              style={[
                textStyles.footer,
                {
                  color: colors.text.heading,
                  fontFamily: fontFamilies.bold,
                },
              ]}
              numberOfLines={1}
            >
              {item.pet.name}
            </AppText>
            <AppText
              style={[textStyles.footer, { color: colors.text.secondary }]}
              numberOfLines={1}
            >
              {what}
            </AppText>
            <AppText
              style={[
                textStyles.footer,
                {
                  color: isHere ? colors.accent : colors.text.muted,
                  fontFamily: fontFamilies.semibold,
                  fontVariant: ['tabular-nums'],
                },
              ]}
              numberOfLines={1}
            >
              {isDone ? 'Done' : item.whenLabel}
            </AppText>
          </View>
        </View>
      </Animated.View>
    </>
  );
};

/**
 * Winding care map — game-path layout with bobbing pin + stop context.
 */
export const CareDayPath: React.FC<CareDayPathProps> = ({
  items,
  onSelect,
  onMarkDone,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies, shadows, isDarkMode } =
    useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const boardWidth = Math.max(windowWidth - spacing.lg * 2, 280);
  const pinBob = useRef(new Animated.Value(0)).current;
  const pinPulse = useRef(new Animated.Value(1)).current;

  const hereItem =
    items.find(
      item => item.urgency === 'overdue' || item.urgency === 'now',
    ) ??
    items.find(
      item => item.urgency !== 'done' && item.urgency !== 'skipped',
    ) ??
    null;
  const hereBlockId = hereItem?.block.id ?? null;
  const hereIndex = hereItem
    ? items.findIndex(item => item.block.id === hereItem.block.id)
    : -1;

  useEffect(() => {
    if (hereIndex < 0) {
      return;
    }
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(pinBob, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pinBob, {
          toValue: 0,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pinPulse, {
          toValue: 1.08,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pinPulse, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    bob.start();
    pulse.start();
    return () => {
      bob.stop();
      pulse.stop();
    };
  }, [hereIndex, pinBob, pinPulse]);

  const boardHeight = TOP_PAD + Math.max(items.length, 1) * ROW + BOTTOM_PAD;
  const trail = useMemo(
    () => buildTrailPath(items.length, boardWidth),
    [boardWidth, items.length],
  );

  const hereCenter =
    hereIndex >= 0 ? nodeCenter(hereIndex, boardWidth) : null;

  const stylesLocal = useMemo(
    () =>
      StyleSheet.create({
        wrap: { gap: spacing.md },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        board: {
          width: boardWidth,
          height: boardHeight,
          borderRadius: radius.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.brandTint20,
          alignSelf: 'center',
        },
        pin: {
          position: 'absolute',
          width: 40,
          height: 48,
          alignItems: 'center',
          zIndex: 30,
        },
        pinHead: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accent,
          borderWidth: 3,
          borderColor: colors.onAccent,
        },
        pinTip: {
          width: 0,
          height: 0,
          marginTop: -4,
          borderLeftWidth: 8,
          borderRightWidth: 8,
          borderTopWidth: 12,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: colors.accent,
        },
        detail: {
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.brandTint20,
          backgroundColor: colors.surface,
          padding: spacing.lg,
          gap: spacing.md,
        },
        detailHead: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        },
        avatar: {
          width: 44,
          height: 44,
          borderRadius: radius.round,
        },
        meta: { flex: 1, minWidth: 0, gap: 2 },
        doneBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
          minHeight: 48,
          borderRadius: radius.lg,
          backgroundColor: colors.accent,
        },
      }),
    [boardHeight, boardWidth, colors, radius, spacing],
  );

  if (items.length === 0) {
    return null;
  }

  const focusItem = hereItem ?? items[0];
  const focusWhat = careTaskShortVerb(focusItem.block);
  const focusState = resolveStopState(focusItem, hereBlockId);

  return (
    <View style={stylesLocal.wrap}>
      <View style={stylesLocal.titleRow}>
        <Paw3dIcon size={22} />
        <AppText
          style={[
            textStyles.caption,
            {
              color: colors.text.secondary,
              fontFamily: fontFamilies.semibold,
              letterSpacing: 0.3,
            },
          ]}
        >
          Today&apos;s care map
        </AppText>
      </View>

      <View style={[stylesLocal.board, shadows.md]}>
        <DayNightSky
          width={boardWidth}
          height={boardHeight}
          isDark={isDarkMode}
        />

        <Svg
          width={boardWidth}
          height={boardHeight}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <Path
            d={trail}
            stroke={isDarkMode ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.1)'}
            strokeWidth={16}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="translate(0, 3)"
          />
          <Path
            d={trail}
            stroke={isDarkMode ? '#D4B896' : '#F3E2C7'}
            strokeWidth={14}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d={trail}
            stroke={colors.accent}
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1 9"
            opacity={0.55}
          />
          {items.map((_, index) => {
            const c = nodeCenter(index, boardWidth);
            const done =
              items[index].urgency === 'done' ||
              items[index].urgency === 'skipped';
            return (
              <Circle
                key={`dot-${index}`}
                cx={c.x}
                cy={c.y}
                r={4}
                fill={done ? colors.success : '#FFF8F0'}
                opacity={0.95}
              />
            );
          })}
        </Svg>

        {items.map((item, index) => (
          <MapNode
            key={`${item.pet.id}:${item.block.id}`}
            item={item}
            index={index}
            state={resolveStopState(item, hereBlockId)}
            boardWidth={boardWidth}
            enterDelay={index * 55}
            onPress={() => onSelect(item)}
          />
        ))}

        {hereCenter ? (
          <Animated.View
            pointerEvents="none"
            style={[
              stylesLocal.pin,
              {
                left: hereCenter.x - 20,
                top: hereCenter.y - NODE / 2 - 52,
                transform: [
                  {
                    translateY: pinBob.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -8],
                    }),
                  },
                  { scale: pinPulse },
                ],
              },
              shadows.md,
            ]}
          >
            <View style={[stylesLocal.pinHead, shadows.sm]}>
              <MaterialIcon name="pets" size={18} color={colors.onAccent} />
            </View>
            <View style={stylesLocal.pinTip} />
          </Animated.View>
        ) : null}
      </View>

      <View style={[stylesLocal.detail, shadows.sm]}>
        <AppText
          style={[
            textStyles.footer,
            {
              color:
                focusState === 'here' ? colors.accent : colors.text.secondary,
              fontFamily: fontFamilies.bold,
            },
          ]}
        >
          {focusState === 'here'
            ? focusItem.urgency === 'overdue'
              ? 'Overdue stop'
              : 'You are here'
            : focusState === 'done'
              ? 'Path complete'
              : 'Next stop'}
        </AppText>
        <View style={stylesLocal.detailHead}>
          <Image
            source={resolvePetAvatarSource(focusItem.pet)}
            style={stylesLocal.avatar}
          />
          <View style={stylesLocal.meta}>
            <AppText
              style={[
                textStyles.subtitle,
                {
                  color: colors.text.heading,
                  fontFamily: fontFamilies.extrabold,
                  letterSpacing: -0.2,
                },
              ]}
              numberOfLines={1}
            >
              {focusItem.pet.name} · {focusWhat}
            </AppText>
            <AppText
              style={[
                textStyles.caption,
                {
                  color: colors.text.secondary,
                  fontVariant: ['tabular-nums'],
                },
              ]}
            >
              {focusItem.whenLabel}
            </AppText>
          </View>
        </View>
        {focusState === 'here' && onMarkDone ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Mark ${focusWhat} done`}
            onPress={() => onMarkDone(focusItem)}
            style={({ pressed }) => [
              stylesLocal.doneBtn,
              {
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <MaterialIcon name="check" size={20} color={colors.onAccent} />
            <AppText
              style={[
                textStyles.subtitle,
                { color: colors.onAccent, fontFamily: fontFamilies.bold },
              ]}
            >
              Done
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nodeAbs: {
    position: 'absolute',
    width: NODE,
    alignItems: 'center',
    zIndex: 12,
  },
  nodeBtn: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeIndex: {
    marginTop: 2,
    textAlign: 'center',
  },
  chipAbs: {
    position: 'absolute',
    zIndex: 11,
    borderWidth: 1,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  chipMeta: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
});
