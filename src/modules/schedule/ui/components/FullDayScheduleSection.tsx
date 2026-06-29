import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { PLAN_CATALOG } from '../../../../shared/subscription/planCatalog';
import type { DailyCareBlock } from '../../domain/models/DailyCareBlock';
import type { DayCompletion } from '../../domain/utils/wellnessCompletion';
import { careCategoryIcon } from '../utils/careCategoryIcon';
import { formatScheduleTimeLabel } from '../utils/scheduleDisplay';

export interface FullDayScheduleSectionProps {
  blocks: DailyCareBlock[];
  isPro: boolean;
  relaxedMode: boolean;
  petName: string;
  completion: DayCompletion;
  onUpgrade: () => void;
}

export const FullDayScheduleSection: React.FC<FullDayScheduleSectionProps> = ({
  blocks,
  isPro,
  relaxedMode,
  petName,
  completion,
  onUpgrade,
}) => {
  const { colors, spacing, radius, textStyles } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const price = PLAN_CATALOG.care_plus.priceMonthlyInr;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        toggle: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: spacing.md,
        },
        list: {
          gap: spacing.sm,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.xs,
        },
        rowText: {
          flex: 1,
          gap: 2,
        },
        footer: {
          marginTop: spacing.sm,
          padding: spacing.md,
          borderRadius: radius.md,
          backgroundColor: colors.surfaceAlt,
        },
      }),
    [colors, radius, spacing],
  );

  const sorted = useMemo(
    () =>
      [...blocks].sort(
        (left, right) =>
          left.scheduledTime.localeCompare(right.scheduledTime) ||
          left.order - right.order,
      ),
    [blocks],
  );

  return (
    <View>
      <Pressable
        style={styles.toggle}
        onPress={() => setExpanded(current => !current)}
        accessibilityRole="button"
      >
        <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
          See all {blocks.length} tasks {expanded ? '▴' : '▾'}
        </AppText>
      </Pressable>

      {expanded ? (
        <View style={styles.list}>
          {sorted.map(block => {
            const locked = !block.isFreeFeature && !isPro;
            const done = block.status === 'done' || block.isCompleted;
            const skipped = block.status === 'skipped';
            const muted = done || skipped;

            return (
              <View key={block.id} style={styles.row}>
                {done ? (
                  <MaterialIcon name="check_circle" size={18} color={colors.success} />
                ) : locked ? (
                  <MaterialIcon name="lock" size={16} color={colors.text.subdued} />
                ) : block.isMissed && !relaxedMode ? (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.warning,
                    }}
                  />
                ) : (
                  <MaterialIcon
                    name={careCategoryIcon(block.category)}
                    size={16}
                    color={relaxedMode ? colors.text.subdued : colors.text.secondary}
                  />
                )}
                <View style={styles.rowText}>
                  <AppText
                    style={[
                      textStyles.body,
                      {
                        color: muted ? colors.text.subdued : colors.text.heading,
                        textDecorationLine: done ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {block.title}
                  </AppText>
                  <AppText style={[textStyles.footer, { color: colors.text.subdued }]}>
                    {formatScheduleTimeLabel(block.scheduledTime)}
                    {skipped ? ' · skipped' : ''}
                  </AppText>
                  {locked ? (
                    <Pressable onPress={onUpgrade} accessibilityRole="button">
                      <AppText style={[textStyles.footer, { color: colors.text.subdued }]}>
                        Unlock with Care+ — ₹{price}/month
                      </AppText>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })}
          {relaxedMode ? (
            <View style={styles.footer}>
              <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
                You completed {completion.done} of {completion.total} tasks — great job caring
                for {petName}!
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};
