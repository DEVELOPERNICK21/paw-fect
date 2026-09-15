import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { WidgetSurface } from '../../../../shared/components/WidgetSurface';
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

/** Instant-scan timing line — relative when close, absolute otherwise. */
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
  bar: string;
  whenFg: string;
};

function statusTone(
  status: SmartHealthRecord['status'],
  colors: AppColors,
  isHero: boolean,
): StatusTone {
  switch (status) {
    case 'completed':
      return {
        label: 'Done',
        fg: colors.success,
        bg: colors.successSurface,
        bar: colors.success,
        whenFg: colors.text.secondary,
      };
    case 'overdue':
    case 'missed':
      return {
        label: 'Needs action',
        fg: colors.danger,
        bg: colors.dangerSurface,
        bar: colors.danger,
        whenFg: colors.danger,
      };
    case 'skipped':
      return {
        label: 'Skipped',
        fg: colors.text.subdued,
        bg: colors.surfaceAlt,
        bar: colors.borderSubtle,
        whenFg: colors.text.secondary,
      };
    case 'locked':
      return {
        label: 'Not yet',
        fg: colors.info,
        bg: colors.infoSurface,
        bar: colors.info,
        whenFg: colors.text.secondary,
      };
    default:
      return {
        label: isHero ? 'Do next' : 'Upcoming',
        fg: colors.accent,
        bg: colors.brandTint12,
        bar: isHero ? colors.accent : colors.borderSubtle,
        whenFg: isHero ? colors.accent : colors.text.heading,
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
      primaryActionLabel = 'Mark as done',
    }) => {
      const theme = useTheme();
      const { colors, fontFamilies, textStyles, radius, spacing, space } =
        theme;
      const isHero = variant === 'hero';
      const tone = statusTone(record.status, colors, isHero);
      const isVaccination = record.type === 'vaccination';
      const title = plainVaccineDisplayName(record.name);
      const whenIso =
        record.status === 'completed'
          ? (record.completedDate ?? record.dueDate)
          : record.dueDate;
      const whenLine = formatWhenLine(whenIso, record.status);
      const hint = vaccineProtectionHint(record.family ?? record.name);
      const cadence =
        record.type === 'deworming' &&
        record.cadence &&
        record.status !== 'completed' &&
        record.status !== 'skipped'
          ? cadenceDisplayLabel(record.cadence)
          : null;

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
        () => createStyles({ colors, radius, spacing, space, isHero }),
        [colors, radius, spacing, space, isHero],
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

      return (
        <WidgetSurface
          theme={theme}
          style={{
            borderLeftWidth: 3,
            borderLeftColor: tone.bar,
            paddingVertical: spacing.lg,
            backgroundColor: isHero ? colors.surface : colors.surface,
          }}
        >
          {/* Meta row: status + type */}
          <View style={styles.metaRow}>
            <View style={[styles.pill, { backgroundColor: tone.bg }]}>
              <AppText
                style={[
                  textStyles.overline,
                  { color: tone.fg, fontFamily: fontFamilies.bold },
                ]}
              >
                {tone.label}
              </AppText>
            </View>
            <View style={styles.typeRow}>
              {isVaccination ? (
                <icons.vaccineIcon width={14} height={15} />
              ) : (
                <icons.dewormIcon width={14} height={14} />
              )}
              <AppText
                style={[
                  textStyles.caption,
                  {
                    color: colors.text.subdued,
                    fontFamily: fontFamilies.medium,
                  },
                ]}
              >
                {isVaccination ? 'Shot' : 'Worm medicine'}
              </AppText>
            </View>
          </View>

          {/* Primary hierarchy: name → when */}
          <AppText
            style={[
              textStyles.title,
              {
                color: colors.text.heading,
                fontFamily: fontFamilies.extrabold,
                marginTop: spacing.sm,
              },
            ]}
            numberOfLines={2}
          >
            {title}
          </AppText>

          <AppText
            style={[
              textStyles.subtitle,
              {
                color: tone.whenFg,
                fontFamily: fontFamilies.bold,
                marginTop: spacing.xs,
              },
            ]}
            numberOfLines={1}
          >
            {whenLine}
            {record.syncPending ? ' · Syncing…' : ''}
          </AppText>

          {/* Supporting only — never compete with when/action */}
          {hint || cadence || record.skipReason ? (
            <AppText
              style={[
                textStyles.caption,
                {
                  color: colors.text.secondary,
                  fontFamily: fontFamilies.regular,
                  marginTop: spacing.xs,
                },
              ]}
              numberOfLines={2}
            >
              {[hint, cadence, record.skipReason?.trim()]
                .filter(Boolean)
                .join(' · ')}
            </AppText>
          ) : null}

          {/* One primary action — full width */}
          {showPrimary ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${primaryActionLabel}: ${title}`}
              onPress={handleMarkDone}
              style={({ pressed }) => [
                styles.primaryCta,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <AppText
                style={[
                  textStyles.control,
                  {
                    color: colors.text.inverse,
                    fontFamily: fontFamilies.bold,
                  },
                ]}
              >
                {primaryActionLabel}
              </AppText>
            </Pressable>
          ) : null}

          {/* Low-weight secondary links */}
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
        </WidgetSurface>
      );
    },
  );

SmartHealthRecordItem.displayName = 'SmartHealthRecordItem';

interface StyleParams {
  colors: AppColors;
  radius: ReturnType<typeof useTheme>['radius'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  space: ReturnType<typeof useTheme>['space'];
  isHero: boolean;
}

const createStyles = ({ colors, radius, spacing, space, isHero }: StyleParams) =>
  StyleSheet.create({
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space('sm'),
    },
    pill: {
      borderRadius: radius.xs,
      paddingHorizontal: space('sm'),
      paddingVertical: space('xxs'),
    },
    typeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space('xs'),
    },
    primaryCta: {
      marginTop: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      borderRadius: radius.sm,
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.lg,
    },
    secondaryRow: {
      marginTop: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: isHero ? 'center' : 'flex-start',
      flexWrap: 'wrap',
      gap: space('xs'),
    },
    secondaryLink: {
      paddingVertical: space('xs'),
    },
  });
