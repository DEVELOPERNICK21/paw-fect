import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { DailyCareBlock } from '../../domain/models/DailyCareBlock';
import { AppText } from '../../../../shared/components/AppText';
import { Button } from '../../../../shared/components/Button';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { formatScheduleTimeLabel } from '../utils/scheduleDisplay';
import {
  periodAccentColor,
  periodAccentSurface,
  splitDescriptionBullets,
  type ScheduleDayPeriod,
} from '../utils/schedulePeriod';

export interface DayCareBlockCardProps {
  block: DailyCareBlock;
  period: ScheduleDayPeriod;
  isCurrent: boolean;
  isExpanded: boolean;
  isLastInTimeline: boolean;
  locked: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  onSnooze: () => void;
  onOpenActions: () => void;
}

export const DayCareBlockCard: React.FC<DayCareBlockCardProps> = React.memo(
  ({
    block,
    period,
    isCurrent,
    isExpanded,
    isLastInTimeline,
    locked,
    onToggleExpand,
    onToggleComplete,
    onSnooze,
    onOpenActions,
  }) => {
    const { colors, spacing, radius, textStyles, fontFamilies, shadows } = useTheme();
    const accent = periodAccentColor(period, colors);
    const accentSurface = periodAccentSurface(period, colors);
    const bullets = useMemo(
      () => splitDescriptionBullets(block.description),
      [block.description],
    );

    const styles = useMemo(
      () =>
        StyleSheet.create({
          row: {
            flexDirection: 'row',
            gap: spacing.md,
          },
          rail: {
            width: spacing.lg,
            alignItems: 'center',
          },
          line: {
            position: 'absolute',
            top: spacing.lg,
            bottom: isLastInTimeline ? spacing['2xl'] : 0,
            width: 2,
            backgroundColor: colors.borderSubtle,
          },
          dot: {
            width: spacing.md,
            height: spacing.md,
            borderRadius: radius.round,
            borderWidth: 2,
            borderColor: accent,
            backgroundColor: block.isCompleted ? accent : colors.surface,
            marginTop: spacing.lg,
            zIndex: 1,
          },
          card: {
            flex: 1,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: isCurrent ? colors.primary : colors.borderSubtle,
            backgroundColor: colors.surface,
            padding: spacing.lg,
            gap: spacing.md,
            opacity: block.isCompleted ? 0.82 : 1,
          },
          cardHead: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: spacing.sm,
          },
          cardBody: {
            flex: 1,
            gap: spacing.xs,
          },
          metaRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            flexWrap: 'wrap',
          },
          pill: {
            alignSelf: 'flex-start',
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xxs,
            borderRadius: radius.round,
            backgroundColor: colors.brandTint10,
          },
          notificationPill: {
            borderRadius: radius.lg,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            backgroundColor: accentSurface,
            gap: spacing.xxs,
          },
          bulletRow: {
            flexDirection: 'row',
            gap: spacing.sm,
          },
          bulletDot: {
            width: spacing.xs,
            height: spacing.xs,
            borderRadius: radius.round,
            backgroundColor: colors.text.subdued,
            marginTop: spacing.sm,
          },
          actions: {
            gap: spacing.sm,
          },
          actionButton: {
            width: '100%',
          },
          iconButton: {
            width: spacing['2xl'] + spacing.xs,
            height: spacing['2xl'] + spacing.xs,
            borderRadius: radius.round,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            backgroundColor: colors.surfaceAlt,
          },
        }),
      [
        accent,
        accentSurface,
        block.isCompleted,
        colors,
        isCurrent,
        isLastInTimeline,
        radius,
        spacing,
      ],
    );

    return (
      <View style={styles.row}>
        <View style={styles.rail}>
          <View style={styles.line} />
          <View style={styles.dot} />
        </View>

        <View style={[styles.card, shadows.sm]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: isExpanded }}
            onPress={onToggleExpand}
            style={({ pressed }) => [pressed ? { opacity: 0.96 } : null]}
          >
            <View style={styles.cardHead}>
              <View style={styles.cardBody}>
                <View style={styles.metaRow}>
                  <AppText
                    style={[
                      textStyles.caption,
                      {
                        color: colors.text.secondary,
                        fontFamily: fontFamilies.semibold,
                      },
                    ]}
                  >
                    {formatScheduleTimeLabel(block.scheduledTime)}
                  </AppText>
                  {isCurrent ? (
                    <View style={styles.pill}>
                      <AppText
                        style={[
                          textStyles.footer,
                          { color: colors.primary, fontFamily: fontFamilies.semibold },
                        ]}
                      >
                        Up next
                      </AppText>
                    </View>
                  ) : null}
                  {locked ? (
                    <MaterialIcon name="lock" size={16} color={colors.text.subdued} />
                  ) : null}
                </View>

                <AppText
                  style={[
                    textStyles.body,
                    {
                      color: colors.text.heading,
                      fontFamily: fontFamilies.bold,
                      textDecorationLine: block.isCompleted ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {block.title}
                </AppText>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={block.isCompleted ? 'Mark incomplete' : 'Mark done'}
                onPress={onToggleComplete}
                disabled={locked}
                style={styles.iconButton}
              >
                <MaterialIcon
                  name={block.isCompleted ? 'check_circle' : 'check'}
                  size={20}
                  color={block.isCompleted ? colors.success : colors.text.subdued}
                />
              </Pressable>
            </View>

            {!isExpanded ? (
              <AppText
                style={[textStyles.caption, { color: colors.text.secondary }]}
                numberOfLines={2}
              >
                {block.notificationBody}
              </AppText>
            ) : null}
          </Pressable>

          {isExpanded ? (
            <>
              {bullets.map(item => (
                <View key={item} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <AppText
                    style={[
                      textStyles.caption,
                      { color: colors.text.secondary, flex: 1 },
                    ]}
                  >
                    {item}
                  </AppText>
                </View>
              ))}

              <View style={styles.notificationPill}>
                <AppText
                  style={[
                    textStyles.footer,
                    { color: colors.text.heading, fontFamily: fontFamilies.semibold },
                  ]}
                >
                  {block.notificationTitle}
                </AppText>
                <AppText style={[textStyles.footer, { color: colors.text.secondary }]}>
                  {block.notificationBody}
                </AppText>
              </View>

              <View style={styles.actions}>
                {locked ? (
                  <Button
                    title="Unlock with Pawfect+"
                    onPress={onOpenActions}
                    style={styles.actionButton}
                  />
                ) : (
                  <>
                    <Button
                      title={block.isCompleted ? 'Undo' : 'Mark done'}
                      onPress={onToggleComplete}
                      style={styles.actionButton}
                    />
                    <Button
                      title="Snooze 30 min"
                      variant="secondary"
                      onPress={onSnooze}
                      style={styles.actionButton}
                    />
                  </>
                )}
              </View>
            </>
          ) : null}
        </View>
      </View>
    );
  },
);

DayCareBlockCard.displayName = 'DayCareBlockCard';
