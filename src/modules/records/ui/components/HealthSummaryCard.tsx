import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText } from '../../../../shared/components/AppText';
import { useTheme } from '../../../../shared/hooks/useTheme';
import {
  describeDaysToNext,
  type HealthSummary,
} from '../../domain/utils/healthSummary';
import { careWhatLabel } from '../../domain/utils/careOwnerCopy';

const RING = 64;
const STROKE = 7;
const R = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export interface HealthSummaryCardProps {
  petName: string;
  summary: HealthSummary;
}

/** One calm, glanceable answer to "is my pet covered?". */
export const HealthSummaryCard: React.FC<HealthSummaryCardProps> = React.memo(
  ({ petName, summary }) => {
    const { colors, fontFamilies, textStyles, radius, spacing } = useTheme();

    const { headline, detail, accent } = useMemo(() => {
      const nextLine =
        summary.next != null && summary.daysToNext != null
          ? `Next: ${careWhatLabel(summary.next)} ${describeDaysToNext(summary.daysToNext)}`
          : null;
      switch (summary.tone) {
        case 'attention':
          return {
            headline:
              summary.overdue === 1
                ? '1 thing needs attention'
                : `${summary.overdue} things need attention`,
            detail: 'Take care of it below to get back on track.',
            accent: colors.warning,
          };
        case 'soon':
          return {
            headline: `${petName} is covered`,
            detail: nextLine ?? 'Something is coming up soon.',
            accent: colors.primary,
          };
        case 'ontrack':
          return {
            headline: `${petName} is on track`,
            detail: nextLine ?? 'Nothing due right now.',
            accent: colors.success,
          };
        default:
          return {
            headline: `Getting ${petName}'s plan ready`,
            detail: 'Your schedule appears here once it is set up.',
            accent: colors.primary,
          };
      }
    }, [summary, petName, colors]);

    const pct = Math.round(summary.progress * 100);
    const styles = useMemo(
      () =>
        StyleSheet.create({
          card: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.md,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            backgroundColor: colors.surface,
          },
          ring: { width: RING, height: RING },
          ringLabel: {
            position: 'absolute',
            width: RING,
            height: RING,
            alignItems: 'center',
            justifyContent: 'center',
          },
          text: { flex: 1, gap: 2 },
        }),
      [colors, radius, spacing],
    );

    return (
      <View
        style={styles.card}
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`${headline}. ${summary.done} of ${summary.total} care items done. ${detail}`}
      >
        <View style={styles.ring}>
          <Svg width={RING} height={RING}>
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={R}
              stroke={colors.borderSubtle}
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={R}
              stroke={accent}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${CIRC} ${CIRC}`}
              strokeDashoffset={CIRC * (1 - summary.progress)}
              rotation={-90}
              origin={`${RING / 2}, ${RING / 2}`}
            />
          </Svg>
          <View style={styles.ringLabel}>
            <AppText
              style={[
                textStyles.caption,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
            >
              {summary.total > 0 ? `${pct}%` : '–'}
            </AppText>
          </View>
        </View>
        <View style={styles.text}>
          <AppText
            style={[
              textStyles.subtitle,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
          >
            {headline}
          </AppText>
          <AppText
            style={[
              textStyles.caption,
              { color: colors.text.secondary, fontFamily: fontFamilies.medium },
            ]}
          >
            {detail}
          </AppText>
          {summary.total > 0 ? (
            <AppText
              style={[textStyles.caption, { color: colors.text.subdued }]}
            >
              {summary.done} of {summary.total} care items done
            </AppText>
          ) : null}
        </View>
      </View>
    );
  },
);
