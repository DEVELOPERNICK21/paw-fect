import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { icons } from '../../../../shared/assets/icons';
import type { AppColors } from '../../../../shared/theme/colors';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { SmartHealthRecord } from '../../domain/models/SmartHealthRecord';
import { cadenceDisplayLabel } from '../../domain/utils/DewormingEngine';
import {
  plainVaccineDisplayName,
  vaccineProtectionHint,
} from '../../domain/utils/vaccinePlainLanguage';

export interface SmartHealthRecordItemProps {
  record: SmartHealthRecord;
  onMarkDone?: (record: SmartHealthRecord) => void;
  /** Reschedule / correct the planned date */
  onEditDate?: (record: SmartHealthRecord) => void;
  /** Deworming: log skip with reason (handled by parent modal) */
  onSkipDose?: (record: SmartHealthRecord) => void;
  variant?: 'default' | 'hero';
  primaryActionLabel?: string;
}

function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const SmartHealthRecordItem: React.FC<SmartHealthRecordItemProps> = React.memo(
  ({
    record,
    onMarkDone,
    onEditDate,
    onSkipDose,
    variant = 'default',
    primaryActionLabel = 'Mark as Done',
  }) => {
  const theme = useTheme();
  const { colors, fontFamilies, textStyles } = theme;

  const styles = useMemo(
    () =>
      createStyles({
        colors,
        radius: theme.radius,
        spacing: theme.spacing,
        space: theme.space,
        variant,
        status: record.status,
      }),
    [colors, theme.radius, theme.spacing, theme.space, variant, record.status],
  );

  const handleMarkDone = useCallback(() => {
    onMarkDone?.(record);
  }, [onMarkDone, record]);

  const handleEditDate = useCallback(() => {
    onEditDate?.(record);
  }, [onEditDate, record]);

  const handleSkipDose = useCallback(() => {
    onSkipDose?.(record);
  }, [onSkipDose, record]);

  const isVaccination = record.type === 'vaccination';

  const badgeText =
    record.status === 'completed'
      ? colors.success
      : record.status === 'missed'
      ? colors.text.subdued
      : record.status === 'skipped'
      ? colors.text.subdued
      : record.status === 'overdue'
      ? colors.danger
      : record.status === 'locked'
      ? colors.info
      : colors.warning;

  const statusLabel =
    record.status === 'completed'
      ? 'COMPLETED'
      : record.status === 'missed'
      ? 'MISSED'
      : record.status === 'skipped'
      ? 'SKIPPED'
      : record.status === 'overdue'
      ? 'OVERDUE'
      : record.status === 'locked'
      ? 'SCHEDULED'
      : 'DUE SOON';

  const detailLine = (() => {
    if (record.status === 'completed') {
      const when = record.completedDate ?? record.dueDate;
      return `Administered ${formatDate(when)}`;
    }
    if (record.status === 'overdue') {
      return `Overdue since ${formatDate(record.dueDate)}`;
    }
    if (record.status === 'missed') {
      return `Missed on ${formatDate(record.dueDate)}`;
    }
    if (record.status === 'skipped') {
      const note = record.skipReason?.trim();
      return note
        ? `Skipped (planned ${formatDate(record.dueDate)}) — ${note}`
        : `Skipped (planned ${formatDate(record.dueDate)})`;
    }
    if (record.status === 'locked') {
      return `Scheduled for ${formatDate(record.dueDate)}`;
    }
    return `Due on ${formatDate(record.dueDate)}`;
  })();

  const dewormingCadenceHint =
    record.type === 'deworming' &&
    record.cadence &&
    record.status !== 'completed' &&
    record.status !== 'skipped'
      ? ` · ${cadenceDisplayLabel(record.cadence)}`
      : '';

  const showActionRow =
    !record.syncPending &&
    (record.status === 'overdue' ||
    record.status === 'upcoming' ||
    record.status === 'missed');
  const showCompletedActions =
    !record.syncPending && record.status === 'completed' && onEditDate;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          {isVaccination ? (
            <icons.vaccineIcon width={19} height={21} />
          ) : (
            <icons.dewormIcon width={20} height={20} />
          )}
        </View>

        <View style={styles.infoCol}>
          <View style={styles.badge}>
            <AppText
              style={[
                textStyles.overline,
                { color: badgeText, fontFamily: fontFamilies.bold },
              ]}
            >
              {statusLabel}
            </AppText>
          </View>
          <AppText
            style={[
              textStyles.subtitle,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
            numberOfLines={2}
          >
            {plainVaccineDisplayName(record.name)}
          </AppText>
          {vaccineProtectionHint(record.family ?? record.name) ? (
            <AppText
              style={[
                textStyles.caption,
                { color: colors.text.secondary, fontFamily: fontFamilies.regular },
              ]}
              numberOfLines={2}
            >
              {vaccineProtectionHint(record.family ?? record.name)}
            </AppText>
          ) : null}
          <AppText
            style={[
              textStyles.caption,
              { color: colors.text.secondary, fontFamily: fontFamilies.medium },
            ]}
            numberOfLines={2}
          >
            {detailLine}
            {dewormingCadenceHint}
            {record.syncPending ? ' · Pending sync' : ''}
          </AppText>
        </View>
      </View>

      {showActionRow ? (
        <View style={styles.actionRow}>
          {onMarkDone ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Mark ${record.name} as done`}
              onPress={handleMarkDone}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionBtnPrimary,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <AppText
                style={[
                  textStyles.caption,
                  { color: colors.text.inverse, fontFamily: fontFamilies.bold },
                ]}
              >
                {primaryActionLabel}
              </AppText>
            </Pressable>
          ) : null}
          {onEditDate ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Reschedule ${record.name}`}
              onPress={handleEditDate}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionBtnOutline,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <AppText
                style={[
                  textStyles.caption,
                  {
                    color: colors.text.secondary,
                    fontFamily: fontFamilies.bold,
                  },
                ]}
              >
                Reschedule
              </AppText>
            </Pressable>
          ) : null}
          {record.type === 'deworming' && onSkipDose ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Skip ${record.name}`}
              onPress={handleSkipDose}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionBtnOutline,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <AppText
                style={[
                  textStyles.caption,
                  {
                    color: colors.text.secondary,
                    fontFamily: fontFamilies.bold,
                  },
                ]}
              >
                Skip dose
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {showCompletedActions ? (
        <View style={styles.completedActionRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit date for ${record.name}`}
            onPress={handleEditDate}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionBtnOutline,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <AppText
              style={[
                textStyles.caption,
                { color: colors.text.body, fontFamily: fontFamilies.bold },
              ]}
            >
              Edit date
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
});

SmartHealthRecordItem.displayName = 'SmartHealthRecordItem';

interface StyleParams {
  colors: AppColors;
  radius: ReturnType<typeof useTheme>['radius'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  space: ReturnType<typeof useTheme>['space'];
  variant: 'default' | 'hero';
  status: SmartHealthRecord['status'];
}

const createStyles = ({
  colors,
  radius,
  spacing,
  space,
  variant,
  status,
}: StyleParams) => {
  const badgeBg =
    status === 'completed'
      ? colors.successSurface
      : status === 'missed'
      ? colors.brandTint10
      : status === 'skipped'
      ? colors.surfaceAlt
      : status === 'overdue'
      ? colors.brandTint20
      : status === 'locked'
      ? colors.infoSurface
      : colors.brandTint12;

  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderRadius: radius.lg,
      backgroundColor: variant === 'hero' ? colors.surface : colors.surfaceAlt,
      borderColor: variant === 'hero' ? colors.brandTint10 : colors.borderSubtle,
      padding: space('md'),
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: space('md'),
    },
    iconCircle: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.round,
      backgroundColor: colors.surface,
      width: spacing['4xl'],
      height: spacing['4xl'],
    },
    infoCol: {
      flex: 1,
      minWidth: 0,
      gap: space('xs'),
    },
    badge: {
      alignSelf: 'flex-start',
      borderRadius: radius.round,
      backgroundColor: badgeBg,
      paddingHorizontal: space('sm'),
      paddingVertical: space('xs'),
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: space('md'),
      gap: space('sm'),
    },
    actionBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      minHeight: 36,
      borderRadius: radius.round,
    },
    actionBtnPrimary: {
      backgroundColor: colors.accent,
    },
    actionBtnOutline: {
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
    },
    completedActionRow: {
      marginTop: space('md'),
      alignItems: 'flex-end',
    },
  });
};
