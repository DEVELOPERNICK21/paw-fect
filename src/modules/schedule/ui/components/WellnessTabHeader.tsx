import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { DayCompletion } from '../../domain/utils/wellnessCompletion';
import { formatScheduleDateLabel } from '../utils/scheduleDisplay';

export interface WellnessTabHeaderProps {
  petName: string;
  date: string;
  completion: DayCompletion;
  streakDays: number;
  isPro?: boolean;
}

/**
 * Calm care header — progress as plain text, not game UI.
 */
export const WellnessTabHeader: React.FC<WellnessTabHeaderProps> = ({
  petName,
  date,
  completion,
  streakDays,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          gap: spacing.sm,
        },
        progressTrack: {
          height: 6,
          borderRadius: radius.pill,
          backgroundColor: colors.surfaceAlt,
          overflow: 'hidden',
          marginTop: spacing.xs,
        },
        progressFill: {
          height: '100%',
          borderRadius: radius.pill,
          backgroundColor: colors.accent,
        },
      }),
    [colors, radius, spacing],
  );

  const total = completion.total;
  const done = completion.done;
  const ratio = total > 0 ? Math.min(1, done / total) : 0;
  const progressLabel =
    total === 0
      ? 'No tasks today'
      : done === total
        ? 'All tasks complete'
        : `${done} of ${total} complete`;

  return (
    <View style={styles.wrap}>
      <AppText
        style={[
          textStyles.caption,
          { color: colors.text.secondary, fontFamily: fontFamilies.semibold },
        ]}
      >
        {formatScheduleDateLabel(date)}
      </AppText>
      <AppText
        style={[
          textStyles.subtitle,
          { color: colors.text.heading, fontFamily: fontFamilies.bold },
        ]}
      >
        {petName}&apos;s care
      </AppText>
      <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
        {progressLabel}
        {streakDays > 0 ? ` · ${streakDays}-day streak` : ''}
      </AppText>
      {total > 0 ? (
        <View
          style={styles.progressTrack}
          accessibilityLabel={progressLabel}
        >
          <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
        </View>
      ) : null}
    </View>
  );
};
