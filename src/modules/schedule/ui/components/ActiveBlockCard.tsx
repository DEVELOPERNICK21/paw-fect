import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { Button } from '../../../../shared/components/Button';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { PLAN_CATALOG } from '../../../../shared/subscription/planCatalog';
import type { DailyCareBlock } from '../../domain/models/DailyCareBlock';
import { careCategoryIcon } from '../utils/careCategoryIcon';
import { formatScheduleTimeLabel } from '../utils/scheduleDisplay';

export interface ActiveBlockCardProps {
  block: DailyCareBlock | null;
  locked: boolean;
  onMarkDone: () => void;
  onSkip: () => void;
  onUpgrade: () => void;
}

export const ActiveBlockCard: React.FC<ActiveBlockCardProps> = ({
  block,
  locked,
  onMarkDone,
  onSkip,
  onUpgrade,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies, shadows } = useTheme();
  const [tipExpanded, setTipExpanded] = useState(false);
  const price = PLAN_CATALOG.care_plus.priceMonthlyInr;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.primary,
          backgroundColor: colors.surface,
          padding: spacing.xl,
          gap: spacing.md,
        },
        head: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.md,
        },
        iconWrap: {
          width: spacing['3xl'],
          height: spacing['3xl'],
          borderRadius: radius.md,
          backgroundColor: colors.brandTint10,
          alignItems: 'center',
          justifyContent: 'center',
        },
        meta: {
          flex: 1,
          gap: spacing.xxs,
        },
        tipBox: {
          borderRadius: radius.md,
          backgroundColor: colors.surfaceAlt,
          padding: spacing.md,
          gap: spacing.xs,
        },
        skipBtn: {
          alignSelf: 'center',
          paddingVertical: spacing.xs,
        },
        upsell: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
      }),
    [colors, radius, spacing],
  );

  if (!block) {
    return null;
  }

  const isActive = block.status === 'active';
  const label = isActive ? 'Now' : 'Up next';

  return (
    <View style={[styles.card, shadows.md]}>
      <AppText
        style={[
          textStyles.caption,
          { color: colors.primary, fontFamily: fontFamilies.semibold },
        ]}
      >
        {label}
      </AppText>
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <MaterialIcon
            name={careCategoryIcon(block.category)}
            size={22}
            color={colors.primary}
          />
        </View>
        <View style={styles.meta}>
          <AppText
            style={[
              textStyles.title,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
          >
            {block.title}
          </AppText>
          <AppText style={[textStyles.caption, { color: colors.text.secondary }]}>
            {formatScheduleTimeLabel(block.scheduledTime)} · {block.durationMinutes} min
          </AppText>
        </View>
      </View>

      {block.insightTip ? (
        <View style={styles.tipBox}>
          <Pressable
            onPress={() => setTipExpanded(current => !current)}
            accessibilityRole="button"
          >
            <AppText
              style={[
                textStyles.caption,
                { color: colors.text.secondary, fontFamily: fontFamilies.semibold },
              ]}
            >
              Why this matters {tipExpanded ? '▴' : '▾'}
            </AppText>
          </Pressable>
          {tipExpanded ? (
            <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
              {block.insightTip}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {locked ? (
        <Pressable style={styles.upsell} onPress={onUpgrade} accessibilityRole="button">
          <MaterialIcon name="lock" size={16} color={colors.text.subdued} />
          <AppText style={[textStyles.caption, { color: colors.text.subdued }]}>
            Unlock with Care+ — ₹{price}/month
          </AppText>
        </Pressable>
      ) : (
        <>
          <Button title="Mark Done" onPress={onMarkDone} />
          <Pressable
            style={styles.skipBtn}
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip for today"
          >
            <AppText style={[textStyles.caption, { color: colors.text.subdued }]}>
              Skip for today
            </AppText>
          </Pressable>
        </>
      )}
    </View>
  );
};
