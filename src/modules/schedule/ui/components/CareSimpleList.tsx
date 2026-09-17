import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { DailyCareBlock } from '../../domain/models/DailyCareBlock';
import { careTaskActionLabel } from '../../domain/utils/careTaskCopy';
import { careCategoryIcon } from '../utils/careCategoryIcon';
import { formatScheduleTimeLabel } from '../utils/scheduleDisplay';

export interface CareSimpleListProps {
  title: string;
  petName: string;
  blocks: DailyCareBlock[];
  onSelectBlock?: (blockId: string) => void;
}

/**
 * Compact upcoming task list — readable, professional.
 */
export const CareSimpleList: React.FC<CareSimpleListProps> = ({
  title,
  petName,
  blocks,
  onSelectBlock,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies, shadows } =
    useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { gap: spacing.sm },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surface,
          minHeight: 60,
        },
        iconWrap: {
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: colors.brandTint12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        textCol: { flex: 1, minWidth: 0, gap: spacing.xxs },
      }),
    [colors, radius, spacing],
  );

  if (blocks.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <AppText
        style={[
          textStyles.caption,
          { color: colors.text.secondary, fontFamily: fontFamilies.semibold },
        ]}
      >
        {title}
      </AppText>
      {blocks.map(block => {
        const action = careTaskActionLabel(block, petName);
        const content = (
          <>
            <View style={styles.iconWrap}>
              <MaterialIcon
                name={careCategoryIcon(block.category)}
                size={20}
                color={colors.accent}
              />
            </View>
            <View style={styles.textCol}>
              <AppText
                style={[
                  textStyles.caption,
                  {
                    color: colors.text.heading,
                    fontFamily: fontFamilies.bold,
                  },
                ]}
                numberOfLines={1}
              >
                {action}
              </AppText>
            </View>
            <AppText
              style={[textStyles.caption, { color: colors.text.secondary }]}
            >
              {formatScheduleTimeLabel(block.scheduledTime)}
            </AppText>
          </>
        );

        if (onSelectBlock) {
          return (
            <Pressable
              key={block.id}
              accessibilityRole="button"
              accessibilityLabel={action}
              onPress={() => onSelectBlock(block.id)}
              style={({ pressed }) => [
                styles.row,
                shadows.sm,
                { opacity: pressed ? 0.92 : 1 },
              ]}
            >
              {content}
            </Pressable>
          );
        }

        return (
          <View key={block.id} style={[styles.row, shadows.sm]}>
            {content}
          </View>
        );
      })}
    </View>
  );
};
