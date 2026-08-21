import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import type { HomeDashboardTodayCareItem } from '../../../domain/models/HomeDashboardViewModel';
import { AppText } from '../../../../../shared/components/AppText';
import type { Theme } from '../../../../../shared/hooks/useTheme';
import { useReduceMotion } from '../../../../../shared/hooks/useReduceMotion';
import { spacing as spacingTokens } from '../../../../../shared/theme/spacing';
import { WidgetSurface } from './WidgetSurface';

export interface HomeUpcomingTasksWidgetProps {
  items: HomeDashboardTodayCareItem[];
  loading: boolean;
  onPressAddTask: () => void;
  onPressRow: () => void;
  onPressViewSchedule?: () => void;
  /** Kebab / overflow — e.g. open schedule. */
  onPressMenu?: () => void;
  theme: Theme;
}

function taskSubtitle(item: HomeDashboardTodayCareItem): string {
  const t = item.reminder.time.trim();
  if (!t || /^all\s*day$/i.test(t)) {
    return 'All day';
  }
  return t;
}

function doneSubtitle(item: HomeDashboardTodayCareItem): string {
  const t = item.reminder.time.trim();
  if (!t || /^all\s*day$/i.test(t)) {
    return 'Done';
  }
  return `Done ${t}`;
}

export const HomeUpcomingTasksWidget: React.FC<HomeUpcomingTasksWidgetProps> =
  React.memo(
    ({
      items,
      loading,
      onPressAddTask,
      onPressRow,
      theme,
    }) => {
      const { colors, radius: r, spacing, textStyles, fontFamilies } = theme;
      const reduceMotion = useReduceMotion();

      const pendingCount = useMemo(
        () => items.filter(i => !i.showCompletedCheck).length,
        [items],
      );

      return (
        <WidgetSurface theme={theme}>
          <View style={{ gap: spacing.sm }}>
            <View style={styles.sectionHead}>
              <AppText
                accessibilityRole="header"
                style={[
                  textStyles.subtitle,
                  {
                    color: colors.text.heading,
                    fontFamily: fontFamilies.bold,
                  },
                ]}
              >
                Tasks
              </AppText>
              {!loading && items.length > 0 ? (
                <AppText
                  style={[
                    textStyles.metricCaption,
                    { color: colors.text.secondary },
                  ]}
                >
                  {pendingCount} left
                </AppText>
              ) : null}
            </View>

            {loading ? (
              <View style={{ gap: spacing.xs }}>
                {[0, 1].map(i => (
                  <View
                    key={i}
                    style={[
                      styles.skel,
                      {
                        backgroundColor: colors.surfaceAlt,
                        borderRadius: r.sm,
                        height: 44,
                      },
                    ]}
                  />
                ))}
              </View>
            ) : null}

            {!loading && items.length === 0 ? (
              <Pressable
                onPress={onPressAddTask}
                accessibilityRole="button"
                accessibilityLabel="Add a task"
                style={styles.footerLink}
              >
                <AppText
                  style={[
                    textStyles.caption,
                    { color: colors.text.secondary, fontFamily: fontFamilies.medium },
                  ]}
                >
                  Nothing scheduled. Add a task.
                </AppText>
              </Pressable>
            ) : null}

            {!loading && items.length > 0 ? (
              <View>
                {items.map(item => {
                  const done = item.showCompletedCheck;
                  return (
                    <Pressable
                      key={item.reminder.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.reminder.title}, ${done ? doneSubtitle(item) : taskSubtitle(item)}`}
                      onPress={onPressRow}
                      style={({ pressed }) => [
                        styles.row,
                        {
                          minHeight: 44,
                          paddingVertical: spacing.sm,
                          opacity:
                            reduceMotion || !pressed
                              ? 1
                              : Platform.OS === 'ios'
                                ? 0.92
                                : 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: done
                              ? colors.success
                              : colors.border,
                          },
                        ]}
                      />
                      <AppText
                        style={[
                          textStyles.caption,
                          {
                            color: done
                              ? colors.text.muted
                              : colors.text.heading,
                            fontFamily: fontFamilies.medium,
                            flex: 1,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.reminder.title}
                      </AppText>
                      <AppText
                        style={[
                          textStyles.metricCaption,
                          { color: colors.text.secondary },
                        ]}
                      >
                        {done ? doneSubtitle(item) : taskSubtitle(item)}
                      </AppText>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={onPressAddTask}
                  accessibilityRole="button"
                  accessibilityLabel="Add a task"
                  style={styles.footerLink}
                >
                  <AppText
                    style={[
                      textStyles.caption,
                      {
                        color: colors.text.secondary,
                        fontFamily: fontFamilies.medium,
                      },
                    ]}
                  >
                    Add task
                  </AppText>
                </Pressable>
              </View>
            ) : null}
          </View>
        </WidgetSurface>
      );
    },
  );

HomeUpcomingTasksWidget.displayName = 'HomeUpcomingTasksWidget';

const styles = StyleSheet.create({
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacingTokens.sm,
  },
  skel: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footerLink: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
});
