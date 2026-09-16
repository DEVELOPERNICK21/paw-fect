import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import type { AppColors } from '../../../../shared/theme/colors';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { SmartHealthRecord } from '../../domain/models/SmartHealthRecord';
import { cadenceDisplayLabel } from '../../domain/utils/DewormingEngine';
import { plainVaccineDisplayName } from '../../domain/utils/vaccinePlainLanguage';
import { resolveHealthRecordCardSurface } from './healthRecordCardSurface';

export interface SmartHealthRecordItemProps {
  record: SmartHealthRecord;
  onMarkDone?: (record: SmartHealthRecord) => void;
  onEditDate?: (record: SmartHealthRecord) => void;
  onSkipDose?: (record: SmartHealthRecord) => void;
  variant?: 'default' | 'hero';
  primaryActionLabel?: string;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseIsoDate(isoDate: string): Date | null {
  const date = new Date(`${isoDate}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatShortDate(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) return isoDate;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatWhenLine(
  isoDate: string,
  status: SmartHealthRecord['status'],
): string {
  if (status === 'completed') {
    return `Given ${formatShortDate(isoDate)}`;
  }
  if (status === 'skipped') {
    return `Skipped · was ${formatShortDate(isoDate)}`;
  }
  if (status === 'locked') {
    return `After earlier dose · ${formatShortDate(isoDate)}`;
  }

  const due = parseIsoDate(isoDate);
  if (!due) return `Due ${isoDate}`;

  const today = startOfLocalDay(new Date());
  const dueDay = startOfLocalDay(due);
  const diffDays = Math.round(
    (dueDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (status === 'overdue' || status === 'missed' || diffDays < 0) {
    const late = Math.abs(diffDays);
    if (late === 0) return 'Due today';
    if (late === 1) return '1 day overdue';
    return `${late} days overdue`;
  }
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `Due in ${diffDays} days`;
  return `Due ${formatShortDate(isoDate)}`;
}

type StatusTone = {
  label: string;
  fg: string;
  bg: string;
  whenFg: string;
  iconBg: string;
  iconFg: string;
};

function statusTone(
  status: SmartHealthRecord['status'],
  colors: AppColors,
  isHero: boolean,
  isVaccination: boolean,
): StatusTone {
  const typeIconBg = isVaccination ? colors.infoSurface : colors.brandTint12;
  const typeIconFg = isVaccination ? colors.info : colors.accent;

  switch (status) {
    case 'completed':
      return {
        label: 'Done',
        fg: colors.success,
        bg: colors.successSurface,
        whenFg: colors.text.secondary,
        iconBg: colors.successSurface,
        iconFg: colors.success,
      };
    case 'overdue':
    case 'missed':
      return {
        label: 'Needs action',
        fg: colors.danger,
        bg: colors.dangerSurface,
        whenFg: colors.danger,
        iconBg: colors.dangerSurface,
        iconFg: colors.danger,
      };
    case 'skipped':
      return {
        label: 'Skipped',
        fg: colors.text.subdued,
        bg: colors.surfaceAlt,
        whenFg: colors.text.secondary,
        iconBg: colors.surfaceAlt,
        iconFg: colors.text.subdued,
      };
    case 'locked':
      return {
        label: 'Not yet',
        fg: colors.info,
        bg: colors.infoSurface,
        whenFg: colors.text.secondary,
        iconBg: colors.infoSurface,
        iconFg: colors.info,
      };
    default:
      return {
        label: isHero ? 'Do next' : 'Upcoming',
        fg: isHero ? colors.accent : colors.text.secondary,
        bg: isHero ? colors.surface : colors.brandTint12,
        whenFg: isHero ? colors.accent : colors.text.heading,
        iconBg: typeIconBg,
        iconFg: typeIconFg,
      };
  }
}

export const SmartHealthRecordItem: React.FC<SmartHealthRecordItemProps> =
  React.memo(
    ({
      record,
      onMarkDone,
      onEditDate,
      onSkipDose,
      variant = 'default',
      primaryActionLabel = 'I did this',
    }) => {
      const theme = useTheme();
      const {
        colors,
        fontFamilies,
        textStyles,
        radius,
        spacing,
        space,
        shadows,
      } = theme;
      const isHero = variant === 'hero';
      const isVaccination = record.type === 'vaccination';
      const tone = statusTone(record.status, colors, isHero, isVaccination);
      const isUrgent =
        record.status === 'overdue' || record.status === 'missed';
      const title = plainVaccineDisplayName(record.name);
      const whenIso =
        record.status === 'completed'
          ? (record.completedDate ?? record.dueDate)
          : record.dueDate;
      const whenLine = formatWhenLine(whenIso, record.status);
      const supportLine =
        record.type === 'deworming' &&
        record.cadence &&
        record.status !== 'completed' &&
        record.status !== 'skipped'
          ? cadenceDisplayLabel(record.cadence)
          : record.skipReason?.trim() || null;

      const cardBg = resolveHealthRecordCardSurface({
        status: record.status,
        isHero,
        colors,
      });
      const cardBorder = isUrgent
        ? colors.danger
        : isHero
          ? colors.brandTint12
          : colors.borderSubtle;

      const showPrimary =
        !record.syncPending &&
        Boolean(onMarkDone) &&
        (record.status === 'overdue' ||
          record.status === 'upcoming' ||
          record.status === 'missed');

      const showSecondary =
        !record.syncPending &&
        ((showPrimary && (onEditDate || onSkipDose)) ||
          (record.status === 'completed' && onEditDate));

      const styles = useMemo(
        () => createStyles({ radius, spacing, space }),
        [radius, spacing, space],
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

      const typeIconName = isVaccination ? 'vaccines' : 'pill';
      const statusIconName =
        record.status === 'completed'
          ? 'check'
          : record.status === 'locked'
            ? 'lock'
            : typeIconName;

      return (
        <View
          style={[
            styles.card,
            isHero ? shadows.md : shadows.sm,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderRadius: radius.xl,
              padding: spacing.lg,
              gap: spacing.md,
            },
          ]}
        >
          <View style={[styles.topRow, { gap: spacing.sm }]}>
            <View
              style={[
                styles.iconTile,
                {
                  backgroundColor: tone.iconBg,
                  borderRadius: radius.md,
                  width: spacing['2xl'] + spacing.xs,
                  height: spacing['2xl'] + spacing.xs,
                },
              ]}
            >
              <MaterialIcon
                name={statusIconName}
                size={22}
                color={tone.iconFg}
              />
            </View>

            <View style={styles.copyCol}>
              <View style={styles.metaRow}>
                <AppText
                  style={[
                    textStyles.footer,
                    {
                      color: colors.text.subdued,
                      fontFamily: fontFamilies.medium,
                    },
                  ]}
                >
                  {isVaccination ? 'Shot' : 'Worm medicine'}
                </AppText>
                <View style={[styles.pill, { backgroundColor: tone.bg }]}>
                  <AppText
                    style={[
                      textStyles.footer,
                      { color: tone.fg, fontFamily: fontFamilies.bold },
                    ]}
                  >
                    {tone.label}
                  </AppText>
                </View>
              </View>
              <AppText
                style={[
                  isHero ? textStyles.title : textStyles.subtitle,
                  {
                    color: colors.text.heading,
                    fontFamily: fontFamilies.bold,
                    marginTop: spacing.xxs,
                  },
                ]}
                numberOfLines={2}
              >
                {title}
              </AppText>
              {supportLine ? (
                <AppText
                  style={[
                    textStyles.caption,
                    {
                      color: colors.text.secondary,
                      marginTop: spacing.xxs,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {supportLine}
                </AppText>
              ) : null}
            </View>
          </View>

          <View
            style={[styles.rule, { backgroundColor: colors.borderSubtle }]}
          />

          <View style={styles.foot}>
            <View style={[styles.whenRow, { gap: spacing.xs }]}>
              <MaterialIcon
                name="event"
                size={16}
                color={tone.whenFg}
              />
              <AppText
                style={[
                  textStyles.metricCaption,
                  {
                    color: tone.whenFg,
                    fontFamily: fontFamilies.bold,
                    flexShrink: 1,
                  },
                ]}
                numberOfLines={1}
              >
                {whenLine}
                {record.syncPending ? ' · Syncing…' : ''}
              </AppText>
            </View>

            {showPrimary ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${primaryActionLabel}: ${title}`}
                onPress={handleMarkDone}
                style={({ pressed }) => [
                  styles.primaryCta,
                  {
                    backgroundColor: isUrgent ? colors.danger : colors.primary,
                    borderRadius: radius.pill,
                    paddingHorizontal: spacing.md,
                    minHeight: 44,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <AppText
                  style={[
                    textStyles.caption,
                    {
                      color: colors.onAccent,
                      fontFamily: fontFamilies.bold,
                    },
                  ]}
                >
                  {primaryActionLabel}
                </AppText>
              </Pressable>
            ) : null}
          </View>

          {showSecondary ? (
            <View style={styles.secondaryRow}>
              {onEditDate ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Change date for ${title}`}
                  onPress={handleEditDate}
                  hitSlop={8}
                  style={styles.secondaryLink}
                >
                  <AppText
                    style={[
                      textStyles.caption,
                      {
                        color: colors.text.secondary,
                        fontFamily: fontFamilies.semibold,
                      },
                    ]}
                  >
                    {record.status === 'completed'
                      ? 'Edit date'
                      : 'Change date'}
                  </AppText>
                </Pressable>
              ) : null}
              {showPrimary &&
              record.type === 'deworming' &&
              onSkipDose ? (
                <>
                  <AppText
                    style={[
                      textStyles.caption,
                      { color: colors.text.muted },
                    ]}
                  >
                    ·
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Skip for now ${title}`}
                    onPress={handleSkipDose}
                    hitSlop={8}
                    style={styles.secondaryLink}
                  >
                    <AppText
                      style={[
                        textStyles.caption,
                        {
                          color: colors.text.secondary,
                          fontFamily: fontFamilies.semibold,
                        },
                      ]}
                    >
                      Skip for now
                    </AppText>
                  </Pressable>
                </>
              ) : null}
            </View>
          ) : null}
        </View>
      );
    },
  );

SmartHealthRecordItem.displayName = 'SmartHealthRecordItem';

interface StyleParams {
  radius: ReturnType<typeof useTheme>['radius'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  space: ReturnType<typeof useTheme>['space'];
}

const createStyles = ({ radius, spacing, space }: StyleParams) =>
  StyleSheet.create({
    card: {
      borderWidth: 1,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconTile: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    copyCol: {
      flex: 1,
      minWidth: 0,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space('sm'),
    },
    pill: {
      borderRadius: radius.pill,
      paddingHorizontal: space('sm'),
      paddingVertical: space('xxs'),
    },
    rule: {
      height: StyleSheet.hairlineWidth,
    },
    foot: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    whenRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 0,
    },
    primaryCta: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: space('xs'),
      marginTop: -spacing.xs,
    },
    secondaryLink: {
      paddingVertical: space('xs'),
    },
  });
