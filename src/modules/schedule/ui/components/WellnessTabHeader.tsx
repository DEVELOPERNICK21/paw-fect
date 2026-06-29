import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText } from '../../../../shared/components/AppText';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { DayCompletion } from '../../domain/utils/wellnessCompletion';
import { formatScheduleDateLabel } from '../utils/scheduleDisplay';
import { todayGreeting } from '../utils/todayGreeting';

export interface WellnessTabHeaderProps {
  petName: string;
  date: string;
  completion: DayCompletion;
  streakDays: number;
}

const RING_SIZE = 56;
const STROKE = 5;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const WellnessTabHeader: React.FC<WellnessTabHeaderProps> = ({
  petName,
  date,
  completion,
  streakDays,
}) => {
  const { colors, spacing, textStyles, fontFamilies } = useTheme();
  const offset = CIRCUMFERENCE * (1 - completion.percentage / 100);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
        },
        textCol: {
          flex: 1,
          gap: spacing.xxs,
        },
        ringWrap: {
          width: RING_SIZE,
          height: RING_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
        },
        ringLabel: {
          position: 'absolute',
        },
        streakPill: {
          alignSelf: 'flex-start',
          marginTop: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: 999,
          backgroundColor: colors.brandTint10,
        },
      }),
    [colors, spacing],
  );

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <AppText
            style={[
              textStyles.caption,
              { color: colors.text.secondary, fontFamily: fontFamilies.semibold },
            ]}
          >
            {petName}&apos;s care · {formatScheduleDateLabel(date)}
          </AppText>
          <AppText
            style={[
              textStyles.title,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
          >
            {todayGreeting()}
          </AppText>
        </View>
        <View style={styles.ringWrap}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={colors.surfaceAlt}
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={colors.primary}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
          <AppText
            style={[
              textStyles.caption,
              styles.ringLabel,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
          >
            {completion.done}/{completion.total || 0}
          </AppText>
        </View>
      </View>
      <View style={styles.streakPill}>
        <AppText
          style={[
            textStyles.caption,
            { color: colors.primary, fontFamily: fontFamilies.semibold },
          ]}
        >
          {streakDays > 0
            ? `🔥 ${streakDays}-day streak`
            : 'Start your streak today 🐾'}
        </AppText>
      </View>
    </View>
  );
};
