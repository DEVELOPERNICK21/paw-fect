import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { AppText } from '../../../../shared/components/AppText';
import { Button } from '../../../../shared/components/Button';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { ScalePressable } from '../../../../shared/components/ScalePressable';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { resolvePetAvatarSource } from '../../../../shared/utils/petDisplayPhoto';
import type { CareAggregatedItem } from '../../domain/utils/careAggregator';
import { careTaskActionLabel } from '../../domain/utils/careTaskCopy';
import { careCategoryIcon } from '../utils/careCategoryIcon';

export interface CareAttentionCardProps {
  item: CareAggregatedItem | null;
  allGood: boolean;
  nextHint?: CareAggregatedItem | null;
  locked: boolean;
  onMarkDone: () => void;
  onLater: () => void;
  onUpgrade: () => void;
}

/**
 * Level-1 Care card — WHO + WHAT + WHEN + Done.
 * Signature: soft status wash + pet photo anchor (not equal-weight cards).
 */
export const CareAttentionCard: React.FC<CareAttentionCardProps> = ({
  item,
  allGood,
  nextHint,
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
          overflow: 'hidden',
          borderWidth: 1,
          backgroundColor: colors.surface,
        },
        wash: {
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
        inner: {
          padding: spacing.xl,
          gap: spacing.lg,
        },
        statusPill: {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.pill,
        },
        statusDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
        },
        head: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.lg,
        },
        avatarRing: {
          padding: 3,
          borderRadius: radius.round,
          borderWidth: 2,
        },
        avatar: {
          width: 64,
          height: 64,
          borderRadius: radius.round,
        },
        meta: { flex: 1, gap: spacing.xs, minWidth: 0 },
        whatRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        iconWell: {
          width: 36,
          height: 36,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
        },
        laterBtn: {
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
        },
        allGoodIcon: {
          width: 52,
          height: 52,
          borderRadius: radius.round,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'flex-start',
        },
      }),
    [colors, radius, spacing],
  );

  if (allGood) {
    return (
      <View
        style={[
          styles.card,
          shadows.md,
          { borderColor: colors.success },
        ]}
      >
        <LinearGradient
          colors={[colors.successSurface, colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.wash}
          pointerEvents="none"
        />
        <View style={styles.inner}>
          <View
            style={[
              styles.allGoodIcon,
              { backgroundColor: colors.successSurface },
            ]}
          >
            <MaterialIcon name="check_circle" size={28} color={colors.success} />
          </View>
          <View style={[styles.statusPill, { backgroundColor: colors.successSurface }]}>
            <View
              style={[styles.statusDot, { backgroundColor: colors.success }]}
            />
            <AppText
              style={[
                textStyles.caption,
                { color: colors.success, fontFamily: fontFamilies.bold },
              ]}
            >
              All good
            </AppText>
          </View>
          <AppText
            style={[
              textStyles.title,
              {
                color: colors.text.heading,
                fontFamily: fontFamilies.extrabold,
                letterSpacing: -0.3,
              },
            ]}
          >
            Everyone is taken care of
          </AppText>
          {nextHint ? (
            <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
              Next · {nextHint.pet.name} ·{' '}
              {careTaskActionLabel(nextHint.block, nextHint.pet.name)} ·{' '}
              {nextHint.whenLabel}
            </AppText>
          ) : (
            <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
              No more care tasks for today.
            </AppText>
          )}
        </View>
      </View>
    );
  }

  if (!item) {
    return null;
  }

  const isOverdue = item.urgency === 'overdue';
  const statusLabel = isOverdue ? 'Overdue' : 'Now';
  const statusColor = isOverdue ? colors.danger : colors.accent;
  const washStart = isOverdue ? colors.dangerSurface : colors.brandTint12;
  const action = careTaskActionLabel(item.block, item.pet.name);

  return (
    <View
      style={[
        styles.card,
        shadows.md,
        { borderColor: isOverdue ? colors.danger : colors.brandTint20 },
      ]}
    >
      <LinearGradient
        colors={[washStart, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.wash}
        pointerEvents="none"
      />
      <View style={styles.inner}>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: isOverdue
                ? colors.dangerSurface
                : colors.brandTint12,
            },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <AppText
            style={[
              textStyles.caption,
              { color: statusColor, fontFamily: fontFamilies.bold },
            ]}
          >
            {statusLabel}
          </AppText>
        </View>

        <View style={styles.head}>
          <View style={[styles.avatarRing, { borderColor: statusColor }]}>
            <Image
              source={resolvePetAvatarSource(item.pet)}
              style={styles.avatar}
            />
          </View>
          <View style={styles.meta}>
            <AppText
              style={[
                textStyles.caption,
                {
                  color: colors.text.secondary,
                  fontFamily: fontFamilies.semibold,
                },
              ]}
            >
              {item.pet.name}
            </AppText>
            <View style={styles.whatRow}>
              <View
                style={[
                  styles.iconWell,
                  { backgroundColor: colors.brandTint12 },
                ]}
              >
                <MaterialIcon
                  name={careCategoryIcon(item.block.category)}
                  size={20}
                  color={colors.accent}
                />
              </View>
              <AppText
                style={[
                  textStyles.title,
                  {
                    color: colors.text.heading,
                    fontFamily: fontFamilies.extrabold,
                    letterSpacing: -0.2,
                    flex: 1,
                  },
                ]}
                numberOfLines={2}
              >
                {action}
              </AppText>
            </View>
            <AppText
              style={[
                textStyles.body,
                {
                  color: colors.text.secondary,
                  fontFamily: fontFamilies.medium,
                },
              ]}
            >
              {item.whenLabel}
            </AppText>
          </View>
        </View>

        {locked ? (
          <Button title="Upgrade to unlock" onPress={onUpgrade} />
        ) : (
          <>
            <ScalePressable
              accessibilityRole="button"
              accessibilityLabel="Mark care task done"
              onPress={onMarkDone}
              pressedScale={0.96}
            >
              <View pointerEvents="none">
                <Button
                  title="Done"
                  leftAccessory={
                    <MaterialIcon
                      name="check"
                      size={20}
                      color={colors.text.inverse}
                    />
                  }
                  style={shadows.sm}
                />
              </View>
            </ScalePressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remind me later"
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
