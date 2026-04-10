import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { icons } from '../../../../shared/assets/icons';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { SmartHealthRecord } from '../../domain/models/SmartHealthRecord';

export interface SmartHealthRecordItemProps {
  record: SmartHealthRecord;
  onMarkDone?: () => void;
  /** Reschedule / correct the planned date */
  onEditDate?: () => void;
  /** Deworming: log skip with reason (handled by parent modal) */
  onSkipDose?: () => void;
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

export const SmartHealthRecordItem: React.FC<SmartHealthRecordItemProps> = ({
  record,
  onMarkDone,
  onEditDate,
  onSkipDose,
  variant = 'default',
  primaryActionLabel = 'Mark as Done',
}) => {
  const { colors, radius, space, spacing, textStyles, fontFamilies } =
    useTheme();
  const isVaccination = record.type === 'vaccination';

  const badgeBg =
    record.status === 'completed'
      ? colors.successSurface
      : record.status === 'missed'
      ? colors.brandTint10
      : record.status === 'skipped'
      ? colors.surfaceAlt
      : record.status === 'overdue'
      ? colors.brandTint20
      : record.status === 'locked'
      ? colors.infoSurface
      : colors.brandTint12;
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

  const cadenceSuffix =
    record.type === 'deworming' &&
    record.recurrenceType === 'quarterly' &&
    record.status !== 'completed'
      ? ' · Every 3 months'
      : '';

  const showActionRow =
    record.status === 'overdue' ||
    record.status === 'upcoming' ||
    record.status === 'missed';
  const showCompletedActions = record.status === 'completed' && onEditDate;

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: radius.lg,
          backgroundColor: variant === 'hero' ? colors.surface : colors.surfaceAlt,
          borderColor: variant === 'hero' ? colors.brandTint10 : colors.borderSubtle,
          padding: space('md'),
        },
      ]}
    >
      <View style={[styles.row, { gap: space('md') }]}>
        <View
          style={[
            styles.iconCircle,
            {
              borderRadius: radius.round,
              backgroundColor: colors.surface,
              width: spacing['4xl'],
              height: spacing['4xl'],
            },
          ]}
        >
          {isVaccination ? (
            <icons.vaccineIcon width={19} height={21} />
          ) : (
            <icons.dewormIcon width={20} height={20} />
          )}
        </View>

        <View style={[styles.infoCol, { gap: space('xs') }]}>
          <View
            style={[
              styles.badge,
              {
                borderRadius: radius.round,
                backgroundColor: badgeBg,
                paddingHorizontal: space('sm'),
                paddingVertical: space('xs'),
              },
            ]}
          >
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
            {record.name}
          </AppText>
          <AppText
            style={[
              textStyles.caption,
              { color: colors.text.secondary, fontFamily: fontFamilies.medium },
            ]}
            numberOfLines={2}
          >
            {detailLine}
            {cadenceSuffix}
          </AppText>
        </View>
      </View>

      {showActionRow ? (
        <View style={[styles.actionRow, { marginTop: space('md'), gap: space('sm') }]}>
          {onMarkDone ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Mark ${record.name} as done`}
              onPress={onMarkDone}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  borderRadius: radius.round,
                  backgroundColor: colors.accent,
                  opacity: pressed ? 0.9 : 1,
                },
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
              onPress={onEditDate}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  borderRadius: radius.round,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <AppText
                style={[
                  textStyles.caption,
                  { color: colors.text.secondary, fontFamily: fontFamilies.bold },
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
              onPress={onSkipDose}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  borderRadius: radius.round,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <AppText
                style={[
                  textStyles.caption,
                  { color: colors.text.secondary, fontFamily: fontFamilies.bold },
                ]}
              >
                Skip dose
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {showCompletedActions ? (
        <View style={{ marginTop: space('md'), alignItems: 'flex-end' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit date for ${record.name}`}
            onPress={onEditDate}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                borderRadius: radius.round,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surface,
                opacity: pressed ? 0.9 : 1,
              },
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
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  badge: {
    alignSelf: 'flex-start',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
  },
});
