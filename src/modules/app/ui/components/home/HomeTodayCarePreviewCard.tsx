import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../../shared/components/AppText';
import { Button } from '../../../../../shared/components/Button';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';
import type { Theme } from '../../../../../shared/hooks/useTheme';
import { fontSizes, lineHeights } from '../../../../../shared/theme/typography';
import { fontFamilies } from '../../../../../shared/theme/fonts';
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
      const { colors, radius, spacing, textStyles } = theme;
      const allComplete = totalCount > 0 && completedCount === totalCount;
      const previewRows = useMemo(() => {
        if (nextBlock) {
          return upcomingBlocks
            .filter(block => block.id !== nextBlock.id && !block.isCompleted)
            .slice(0, 2);
        }
        return upcomingBlocks.filter(block => !block.isCompleted).slice(0, 2);
      }, [nextBlock, upcomingBlocks]);

      return (
        <WidgetSurface theme={theme}>
          <View style={{ gap: spacing.md }}>
            <View style={styles.sectionHead}>
              <AppText
                style={[
                  textStyles.title,
                  { color: colors.text.heading, fontFamily: fontFamilies.extrabold },
                ]}
              >
                Today&apos;s care
              </AppText>
              {!loading && totalCount > 0 ? (
                <AppText
                  style={[
                    textStyles.caption,
                    { color: colors.text.secondary, fontFamily: fontFamilies.semibold },
                  ]}
                >
                  {completedCount}/{totalCount} done
                </AppText>
              ) : null}
            </View>

            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.primary} />
                <AppText style={[textStyles.caption, { color: colors.text.secondary }]}>
                  Loading today&apos;s plan…
                </AppText>
              </View>
            ) : null}

            {!loading && totalCount === 0 ? (
              <View style={{ gap: spacing.sm }}>
                <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
                  Set up {petName}&apos;s daily rhythm to see meals, walks, and care blocks
                  here.
                </AppText>
                <Button title="Set up care schedule" onPress={onPressSetup} />
              </View>
            ) : null}

            {!loading && totalCount > 0 ? (
              <View style={{ gap: spacing.md }}>
                <View
                  style={[
                    styles.progressTrack,
                    {
                      backgroundColor: colors.surfaceAlt,
                      borderRadius: radius.round,
                      height: spacing.sm,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: colors.primary,
                        borderRadius: radius.round,
                        width: `${completionPercent}%`,
                      },
                    ]}
                  />
                </View>

                {allComplete ? (
                  <View
                    style={[
                      styles.completeCard,
                      {
                        borderRadius: radius.lg,
                        backgroundColor: colors.successSurface,
                        padding: spacing.md,
                        gap: spacing.xs,
                      },
                    ]}
                  >
                    <AppText
                      style={[
                        textStyles.body,
                        { color: colors.text.heading, fontFamily: fontFamilies.bold },
                      ]}
                    >
                      {petName}&apos;s day is complete
                    </AppText>
                    <AppText style={[textStyles.caption, { color: colors.text.secondary }]}>
                      Wellness score {completionPercent}%.
                    </AppText>
                  </View>
                ) : null}

                {!allComplete && nextBlock ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Up next: ${nextBlock.title}`}
                    onPress={onPressViewCare}
                    style={[
                      styles.upNextCard,
                      {
                        borderRadius: radius.lg,
                        borderColor: colors.warning,
                        backgroundColor: colors.brandTint10,
                        padding: spacing.md,
                        gap: spacing.xs,
                      },
                    ]}
                  >
                    <View style={styles.upNextLabelRow}>
                      <AppText
                        style={[
                          textStyles.footer,
                          { color: colors.warning, fontFamily: fontFamilies.bold },
                        ]}
                      >
                        Up next
                      </AppText>
                      <AppText
                        style={[
                          textStyles.caption,
                          { color: colors.text.secondary, fontFamily: fontFamilies.semibold },
                        ]}
                      >
                        {formatScheduleTimeLabel(nextBlock.scheduledTime)}
                      </AppText>
                    </View>
                    <AppText
                      style={[
                        textStyles.body,
                        { color: colors.text.heading, fontFamily: fontFamilies.bold },
                      ]}
                    >
                      {nextBlock.title}
                    </AppText>
                  </Pressable>
                ) : null}

                {!allComplete && previewRows.length > 0 ? (
                  <View style={{ gap: spacing.sm }}>
                    {previewRows.map(block => (
                      <Pressable
                        key={block.id}
                        accessibilityRole="button"
                        accessibilityLabel={block.title}
                        onPress={onPressViewCare}
                        style={[
                          styles.row,
                          {
                            borderRadius: radius.md,
                            backgroundColor: colors.surfaceAlt,
                            padding: spacing.md,
                          },
                        ]}
                      >
                        <AppText
                          style={[
                            textStyles.caption,
                            {
                              color: colors.text.secondary,
                              fontFamily: fontFamilies.semibold,
                              width: spacing['3xl'],
                            },
                          ]}
                        >
                          {formatScheduleTimeLabel(block.scheduledTime)}
                        </AppText>
                        <AppText
                          style={[
                            textStyles.body,
                            { color: colors.text.heading, flex: 1 },
                          ]}
                          numberOfLines={1}
                        >
                          {block.title}
                        </AppText>
                        <MaterialIcon name="chevron_right" size={18} color={colors.text.subdued} />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}

            {!loading && totalCount > 0 ? (
              <Button
                title="Open wellness"
                onPress={onPressViewCare}
                style={{
                  width: '100%',
                  borderRadius: radius.lg,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                }}
                textStyle={{
                  fontFamily: fontFamilies.bold,
                  fontSize: fontSizes.md,
                  lineHeight: lineHeights.md,
                }}
              />
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
    gap: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  upNextCard: {
    borderWidth: 1,
  },
  upNextLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  completeCard: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
