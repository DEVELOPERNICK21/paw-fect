import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { Button } from '../../../../shared/components/Button';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { DailyCareBlock } from '../../domain/models/DailyCareBlock';
import {
  careTaskActionLabel,
  careTaskSubtitle,
} from '../../domain/utils/careTaskCopy';
import { careCategoryIcon } from '../utils/careCategoryIcon';
import { formatScheduleTimeLabel } from '../utils/scheduleDisplay';

export interface ActiveBlockCardProps {
  block: DailyCareBlock | null;
  petName: string;
  locked: boolean;
  onMarkDone: () => void;
  onLater: () => void;
  onUpgrade: () => void;
}

/**
 * Primary care task card — calm, professional, one clear action.
 */
export const ActiveBlockCard: React.FC<ActiveBlockCardProps> = ({
  block,
  petName,
  locked,
  onMarkDone,
  onLater,
  onUpgrade,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies, shadows } =
    useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surface,
          padding: spacing.xl,
          gap: spacing.lg,
        },
        head: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.md,
        },
        iconWrap: {
          width: 48,
          height: 48,
          borderRadius: radius.md,
          backgroundColor: colors.brandTint12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        meta: {
          flex: 1,
          gap: spacing.xxs,
          minWidth: 0,
        },
        actions: {
          gap: spacing.sm,
        },
        laterBtn: {
          minHeight: 48,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.sm,
        },
      }),
    [colors, radius, spacing],
  );

  if (!block) {
    return null;
  }

  const action = careTaskActionLabel(block, petName);
  const detail = careTaskSubtitle(block);

  return (
    <View style={[styles.card, shadows.sm]}>
      <AppText
        style={[
          textStyles.caption,
          { color: colors.text.secondary, fontFamily: fontFamilies.semibold },
        ]}
      >
        Now
      </AppText>

      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <MaterialIcon
            name={careCategoryIcon(block.category)}
            size={24}
            color={colors.accent}
          />
        </View>
        <View style={styles.meta}>
          <AppText
            style={[
              textStyles.subtitle,
              {
                color: colors.text.heading,
                fontFamily: fontFamilies.bold,
              },
            ]}
          >
            {action}
          </AppText>
          <AppText
            style={[textStyles.body, { color: colors.text.secondary }]}
            numberOfLines={2}
          >
            {detail}
            {block.scheduledTime
              ? ` · ${formatScheduleTimeLabel(block.scheduledTime)}`
              : ''}
          </AppText>
        </View>
      </View>

      <View style={styles.actions}>
        {locked ? (
          <Button title="Upgrade to unlock" onPress={onUpgrade} />
        ) : (
          <>
            <Button title="Mark as done" onPress={onMarkDone} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remind me later about ${action}`}
              onPress={onLater}
              style={styles.laterBtn}
            >
              <AppText
                style={[
                  textStyles.caption,
                  { color: colors.accent, fontFamily: fontFamilies.semibold },
                ]}
              >
                Remind me later
              </AppText>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
};
