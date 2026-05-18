import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { DailyCareBlock } from '../../domain/models/DailyCareBlock';
import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { formatScheduleTimeLabel } from '../utils/scheduleDisplay';

export interface CareBlockRowProps {
  block: DailyCareBlock;
  isCurrent: boolean;
  locked: boolean;
  onPress: () => void;
}

export const CareBlockRow: React.FC<CareBlockRowProps> = React.memo(
  ({ block, isCurrent, locked, onPress }) => {
    const { colors, spacing, radius, textStyles, fontFamilies } = useTheme();
    const styles = useMemo(
      () =>
        StyleSheet.create({
          row: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: isCurrent ? colors.primary : colors.borderSubtle,
            backgroundColor: colors.surface,
          },
          time: {
            width: 72,
          },
          content: {
            flex: 1,
            minWidth: 0,
            gap: spacing.xxs,
          },
          pill: {
            alignSelf: 'flex-start',
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xxs,
            borderRadius: radius.round,
            backgroundColor: colors.brandTint10,
          },
        }),
      [colors, isCurrent, radius, spacing],
    );

    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed ? { opacity: 0.9 } : null]}
      >
        <AppText
          style={[
            styles.time,
            textStyles.caption,
            {
              color: block.isCompleted ? colors.text.subdued : colors.text.heading,
              textDecorationLine: block.isCompleted ? 'line-through' : 'none',
              fontFamily: fontFamilies.semibold,
            },
          ]}
        >
          {formatScheduleTimeLabel(block.scheduledTime)}
        </AppText>
        <View style={styles.content}>
          <AppText
            style={[
              textStyles.body,
              {
                color: colors.text.heading,
                fontFamily: fontFamilies.semibold,
              },
            ]}
            numberOfLines={2}
          >
            {block.title}
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
        </View>
        {locked ? (
          <MaterialIcon name="lock" size={20} color={colors.text.subdued} />
        ) : block.isCompleted ? (
          <MaterialIcon name="check_circle" size={22} color={colors.success} />
        ) : (
          <MaterialIcon name="radio_button_unchecked" size={22} color={colors.border} />
        )}
      </Pressable>
    );
  },
);

CareBlockRow.displayName = 'CareBlockRow';
