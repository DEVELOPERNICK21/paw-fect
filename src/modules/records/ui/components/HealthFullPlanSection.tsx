import React, { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';

import { icons } from '../../../../shared/assets/icons';
import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { SmartHealthRecord } from '../../domain/models/SmartHealthRecord';
import { careWhatLabel } from '../../domain/utils/careOwnerCopy';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface HealthFullPlanSectionProps {
  records: SmartHealthRecord[];
  onPressItem?: (record: SmartHealthRecord) => void;
}

type PlanTab = 'coming' | 'done';

type PlanRow = {
  record: SmartHealthRecord;
  label: string;
  date: string;
  isWorm: boolean;
  done: boolean;
  skipped: boolean;
  overdue: boolean;
};

function formatPlanDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function animateLayout(): void {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

export const HealthFullPlanSection: React.FC<HealthFullPlanSectionProps> =
  React.memo(({ records, onPressItem }) => {
    const theme = useTheme();
    const { colors, fontFamilies, textStyles, radius, spacing, shadows } =
      theme;
    const [expanded, setExpanded] = useState(false);
    const [tab, setTab] = useState<PlanTab>('coming');

    const { comingRows, doneRows } = useMemo(() => {
      const coming: PlanRow[] = [];
      const done: PlanRow[] = [];

      for (const r of records) {
        const isWorm = r.type === 'deworming';
        const label = careWhatLabel(r);
        if (
          r.status === 'upcoming' ||
          r.status === 'locked' ||
          r.status === 'overdue' ||
          r.status === 'missed'
        ) {
          coming.push({
            record: r,
            label,
            date: r.dueDate,
            isWorm,
            done: false,
            skipped: false,
            overdue: r.status === 'overdue' || r.status === 'missed',
          });
        } else if (r.status === 'completed' || r.status === 'skipped') {
          done.push({
            record: r,
            label,
            date: r.completedDate ?? r.dueDate,
            isWorm,
            done: r.status === 'completed',
            skipped: r.status === 'skipped',
            overdue: false,
          });
        }
      }

      coming.sort((a, b) => a.date.localeCompare(b.date));
      done.sort((a, b) => b.date.localeCompare(a.date));

      return { comingRows: coming, doneRows: done };
    }, [records]);

    const visibleRows = tab === 'coming' ? comingRows : doneRows;
    // Same count as Done tab (completed + skipped).
    const doneCount = doneRows.length;

    const styles = useMemo(
      () =>
        StyleSheet.create({
          wrap: { gap: spacing.sm },
          headerCard: {
            borderWidth: 1,
            padding: spacing.md,
          },
          headerTop: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.sm,
          },
          headerCopy: { flex: 1, minWidth: 0 },
          statsRow: {
            flexDirection: 'row',
            gap: spacing.sm,
            marginTop: spacing.sm,
          },
          statChip: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
          },
          panel: {
            borderWidth: 1,
            padding: spacing.md,
            gap: spacing.md,
          },
          segmentTrack: {
            flexDirection: 'row',
            padding: spacing.xxs,
            gap: spacing.xxs,
          },
          segment: {
            flex: 1,
            minHeight: 40,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: spacing.xs,
          },
          timeline: { gap: 0 },
          row: {
            flexDirection: 'row',
            alignItems: 'stretch',
            minHeight: 56,
          },
          rail: {
            width: 40,
            alignItems: 'center',
          },
          railLine: {
            width: 2,
            flex: 1,
          },
          iconBubble: {
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          },
          rowBody: {
            flex: 1,
            minWidth: 0,
            paddingBottom: spacing.md,
            paddingLeft: spacing.sm,
            justifyContent: 'center',
          },
          rowCard: {
            borderWidth: 1,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            gap: spacing.xxs,
          },
          empty: {
            paddingVertical: spacing.md,
            alignItems: 'center',
            gap: spacing.xs,
          },
        }),
      [spacing],
    );

    const toggleExpanded = (): void => {
      animateLayout();
      setExpanded(v => !v);
    };

    const selectTab = (next: PlanTab): void => {
      animateLayout();
      setTab(next);
    };

    return (
      <View style={styles.wrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel="See full plan"
          onPress={toggleExpanded}
          style={({ pressed }) => [
            styles.headerCard,
            shadows.sm,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
              borderRadius: radius.xl,
              opacity: pressed ? 0.96 : 1,
            },
          ]}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerCopy}>
              <AppText
                style={[
                  textStyles.subtitle,
                  {
                    color: colors.text.heading,
                    fontFamily: fontFamilies.bold,
                  },
                ]}
              >
                Full health plan
              </AppText>
              <AppText
                style={[
                  textStyles.caption,
                  { color: colors.text.secondary, marginTop: spacing.xxs },
                ]}
              >
                {expanded
                  ? 'Switch tabs for Coming up and Done'
                  : "See what's next and what's already done"}
              </AppText>
            </View>
            <MaterialIcon
              name={expanded ? 'expand_less' : 'expand_more'}
              size={24}
              color={colors.text.secondary}
            />
          </View>

          <View style={styles.statsRow}>
            <View
              style={[
                styles.statChip,
                {
                  backgroundColor: colors.brandTint12,
                  borderRadius: radius.pill,
                },
              ]}
            >
              <MaterialIcon name="event" size={14} color={colors.accent} />
              <AppText
                style={[
                  textStyles.footer,
                  { color: colors.accent, fontFamily: fontFamilies.bold },
                ]}
              >
                {comingRows.length} coming
              </AppText>
            </View>
            <View
              style={[
                styles.statChip,
                {
                  backgroundColor: colors.successSurface,
                  borderRadius: radius.pill,
                },
              ]}
            >
              <MaterialIcon name="check" size={14} color={colors.success} />
              <AppText
                style={[
                  textStyles.footer,
                  { color: colors.success, fontFamily: fontFamilies.bold },
                ]}
              >
                {doneCount} done
              </AppText>
            </View>
          </View>
        </Pressable>

        {expanded ? (
          <View
            style={[
              styles.panel,
              shadows.sm,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
                borderRadius: radius.xl,
              },
            ]}
          >
            <View
              style={[
                styles.segmentTrack,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: radius.pill,
                },
              ]}
            >
              {(
                [
                  {
                    key: 'coming' as const,
                    label: 'Coming up',
                    count: comingRows.length,
                  },
                  {
                    key: 'done' as const,
                    label: 'Done',
                    count: doneCount,
                  },
                ] as const
              ).map(seg => {
                const selected = tab === seg.key;
                return (
                  <Pressable
                    key={seg.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${seg.label}, ${seg.count}`}
                    onPress={() => selectTab(seg.key)}
                    style={({ pressed }) => [
                      styles.segment,
                      {
                        borderRadius: radius.pill,
                        backgroundColor: selected
                          ? colors.accent
                          : 'transparent',
                        opacity: pressed && !selected ? 0.85 : 1,
                      },
                    ]}
                  >
                    <AppText
                      style={[
                        textStyles.caption,
                        {
                          color: selected
                            ? colors.text.inverse
                            : colors.text.secondary,
                          fontFamily: selected
                            ? fontFamilies.bold
                            : fontFamilies.medium,
                        },
                      ]}
                    >
                      {seg.label}
                    </AppText>
                    <AppText
                      style={[
                        textStyles.footer,
                        {
                          color: selected
                            ? colors.text.inverse
                            : colors.text.subdued,
                          fontFamily: fontFamilies.bold,
                        },
                      ]}
                    >
                      {seg.count}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            {visibleRows.length === 0 ? (
              <View style={styles.empty}>
                <MaterialIcon
                  name={tab === 'done' ? 'check' : 'event'}
                  size={28}
                  color={colors.text.subdued}
                />
                <AppText
                  style={[
                    textStyles.caption,
                    {
                      color: colors.text.secondary,
                      textAlign: 'center',
                    },
                  ]}
                >
                  {tab === 'done'
                    ? 'No completed care yet — mark something done above.'
                    : 'Nothing scheduled right now.'}
                </AppText>
              </View>
            ) : (
              <View style={styles.timeline}>
                {visibleRows.map((row, index) => {
                  const isLast = index === visibleRows.length - 1;
                  const TypeIcon = row.isWorm
                    ? icons.dewormIcon
                    : icons.vaccineIcon;
                  const bubbleBg = row.done
                    ? colors.successSurface
                    : row.overdue
                      ? colors.dangerSurface
                      : row.isWorm
                        ? colors.brandTint12
                        : colors.infoSurface;

                  return (
                    <Pressable
                      key={row.record.id}
                      accessibilityRole={onPressItem ? 'button' : undefined}
                      accessibilityLabel={`${row.isWorm ? 'Worm' : 'Shot'} ${row.label}, ${formatPlanDate(row.date)}`}
                      disabled={!onPressItem}
                      onPress={() => onPressItem?.(row.record)}
                      style={styles.row}
                    >
                      <View style={styles.rail}>
                        <View
                          style={[
                            styles.iconBubble,
                            {
                              backgroundColor: bubbleBg,
                              borderRadius: radius.round,
                            },
                          ]}
                        >
                          {row.done ? (
                            <MaterialIcon
                              name="check"
                              size={18}
                              color={colors.success}
                            />
                          ) : (
                            <TypeIcon width={18} height={18} />
                          )}
                        </View>
                        {!isLast ? (
                          <View
                            style={[
                              styles.railLine,
                              { backgroundColor: colors.borderSubtle },
                            ]}
                          />
                        ) : null}
                      </View>

                      <View style={styles.rowBody}>
                        <View
                          style={[
                            styles.rowCard,
                            {
                              backgroundColor: row.overdue
                                ? colors.dangerSurface
                                : colors.surfaceAlt,
                              borderColor: row.overdue
                                ? colors.danger
                                : colors.borderSubtle,
                              borderRadius: radius.lg,
                            },
                          ]}
                        >
                          <AppText
                            style={[
                              textStyles.footer,
                              {
                                color: row.isWorm
                                  ? colors.accent
                                  : colors.info,
                                fontFamily: fontFamilies.bold,
                              },
                            ]}
                          >
                            {row.isWorm ? 'Worm medicine' : 'Shot'}
                            {row.skipped
                              ? ' · Skipped'
                              : row.done
                                ? ' · Done'
                                : row.overdue
                                  ? ' · Needs attention'
                                  : row.record.status === 'locked'
                                    ? ' · Not yet'
                                    : ''}
                          </AppText>
                          <AppText
                            style={[
                              textStyles.caption,
                              {
                                color: colors.text.heading,
                                fontFamily: fontFamilies.semibold,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {row.label}
                          </AppText>
                          <AppText
                            style={[
                              textStyles.footer,
                              {
                                color: row.overdue
                                  ? colors.danger
                                  : colors.text.secondary,
                              },
                            ]}
                          >
                            {formatPlanDate(row.date)}
                          </AppText>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}
      </View>
    );
  });

HealthFullPlanSection.displayName = 'HealthFullPlanSection';
