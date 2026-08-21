import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../../shared/components/AppText';
import { Button } from '../../../../../shared/components/Button';
import type { Theme } from '../../../../../shared/hooks/useTheme';
import { formatScheduleTimeLabel } from '../../../../schedule/ui/utils/scheduleDisplay';
import { WidgetSurface } from './WidgetSurface';

export interface HomeTodayCarePreviewItem {
  id: string;
  title: string;
  scheduledTime: string;
  isCompleted: boolean;
}

export interface HomeTodayCarePreviewCardProps {
  petName: string;
  loading: boolean;
  completedCount: number;
  totalCount: number;
  completionPercent: number;
  nextBlock: HomeTodayCarePreviewItem | null;
  upcomingBlocks: HomeTodayCarePreviewItem[];
  onPressViewCare: () => void;
  onPressSetup: () => void;
  theme: Theme;
}

const VISIBLE_QUEUE_ROWS = 5;

export const HomeTodayCarePreviewCard: React.FC<HomeTodayCarePreviewCardProps> =
  React.memo(
    ({
      petName,
      loading,
      completedCount,
      totalCount,
      completionPercent,
      nextBlock,
      upcomingBlocks,
      onPressViewCare,
      onPressSetup,
      theme,
    }) => {
      const { colors, radius, spacing, textStyles, fontFamilies } = theme;
      const allComplete = totalCount > 0 && completedCount === totalCount;
      const { queueRows, hiddenCount } = useMemo(() => {
        const pending = upcomingBlocks.filter(block => !block.isCompleted);
        const done = upcomingBlocks.filter(block => block.isCompleted);
        const ordered = [...pending, ...done];
        return {
          queueRows: ordered.slice(0, VISIBLE_QUEUE_ROWS),
          hiddenCount: Math.max(0, ordered.length - VISIBLE_QUEUE_ROWS),
        };
      }, [upcomingBlocks]);

      return (
        <WidgetSurface theme={theme}>
          <View style={{ gap: spacing.sm }}>
            <View style={styles.sectionHead}>
              <AppText
                accessibilityRole="header"
                style={[
                  textStyles.subtitle,
                  { color: colors.text.heading, fontFamily: fontFamilies.bold },
                ]}
              >
                Today
              </AppText>
              {!loading && totalCount > 0 ? (
                <AppText
                  style={[
                    textStyles.metricCaption,
                    { color: colors.text.secondary },
                  ]}
                >
                  {completedCount}/{totalCount}
                </AppText>
              ) : null}
            </View>

            {!loading && totalCount > 0 ? (
              <View
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel={`${completedCount} of ${totalCount} done`}
                accessibilityValue={{
                  min: 0,
                  max: 100,
                  now: completionPercent,
                }}
                style={[
                  styles.progressTrack,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderRadius: radius.round,
                    height: spacing.xs,
                  },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.accent,
                      borderRadius: radius.round,
                      width: `${completionPercent}%`,
                    },
                  ]}
                />
              </View>
            ) : null}

            {loading ? (
              <View style={{ gap: spacing.xs }}>
                {[0, 1, 2].map(i => (
                  <View
                    key={i}
                    style={[
                      styles.skeletonRow,
                      {
                        backgroundColor: colors.surfaceAlt,
                        borderRadius: radius.sm,
                        height: 44,
                      },
                    ]}
                  />
                ))}
              </View>
            ) : null}

            {!loading && totalCount === 0 ? (
              <View style={{ gap: spacing.sm }}>
                <AppText
                  style={[textStyles.caption, { color: colors.text.secondary }]}
                >
                  Set up {petName}&apos;s daily rhythm to see meals, walks, and
                  care here.
                </AppText>
                <Button title="Set up care schedule" onPress={onPressSetup} />
              </View>
            ) : null}

            {!loading && allComplete ? (
              <AppText
                style={[textStyles.caption, { color: colors.text.secondary }]}
              >
                {petName}&apos;s day is complete.
              </AppText>
            ) : null}

            {!loading && queueRows.length > 0 ? (
              <View>
                {queueRows.map(block => {
                  const isNext = nextBlock?.id === block.id && !block.isCompleted;
                  return (
                    <Pressable
                      key={block.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${block.title}, ${formatScheduleTimeLabel(block.scheduledTime)}`}
                      onPress={onPressViewCare}
                      style={[
                        styles.row,
                        {
                          minHeight: 44,
                          paddingVertical: spacing.sm,
                          paddingHorizontal: spacing.sm,
                          backgroundColor: isNext
                            ? colors.brandTint5
                            : 'transparent',
                          borderLeftWidth: 2,
                          borderLeftColor: isNext
                            ? colors.accent
                            : 'transparent',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: block.isCompleted
                              ? colors.success
                              : isNext
                                ? colors.accent
                                : colors.border,
                          },
                        ]}
                      />
                      <AppText
                        style={[
                          textStyles.body,
                          {
                            color: block.isCompleted
                              ? colors.text.muted
                              : colors.text.heading,
                            flex: 1,
                            fontFamily: fontFamilies.medium,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {block.title}
                      </AppText>
                      <AppText
                        style={[
                          textStyles.metricCaption,
                          { color: colors.text.secondary },
                        ]}
                      >
                        {formatScheduleTimeLabel(block.scheduledTime)}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {!loading && totalCount > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  hiddenCount > 0
                    ? `${hiddenCount} more. Open wellness`
                    : 'Open wellness'
                }
                onPress={onPressViewCare}
                hitSlop={8}
                style={styles.footerLink}
              >
                <AppText
                  style={[
                    textStyles.caption,
                    {
                      color: colors.text.secondary,
                      fontFamily: fontFamilies.medium,
                    },
                  ]}
                >
                  {hiddenCount > 0
                    ? `${hiddenCount} more in wellness`
                    : 'Open wellness'}
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </WidgetSurface>
      );
    },
  );

HomeTodayCarePreviewCard.displayName = 'HomeTodayCarePreviewCard';

const styles = StyleSheet.create({
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  progressTrack: {
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  skeletonRow: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footerLink: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
});
