import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import type { HomeDashboardTodayCareItem } from '../../../domain/models/HomeDashboardViewModel';
import type { ReminderType } from '../../../../reminders/domain/models/Reminder';
import { AppText } from '../../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';
import type { IconName } from '../../../../../shared/components/MaterialIcon';
import type { Theme } from '../../../../../shared/hooks/useTheme';
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

function trailingIconForType(type: ReminderType): IconName {
  switch (type) {
    case 'grooming':
      return 'content_cut';
    case 'vaccination':
    case 'medication':
    case 'checkup':
    case 'other':
    default:
      return 'notifications';
  }
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
  return `Done at ${t}`;
}

export const HomeUpcomingTasksWidget: React.FC<HomeUpcomingTasksWidgetProps> =
  React.memo(
    ({
      items,
      loading,
      onPressAddTask,
      onPressRow,
      onPressViewSchedule,
      onPressMenu,
      theme,
    }) => {
      const { colors, radius: r, spacing, textStyles, fontFamilies } = theme;

      const menuAction = onPressMenu ?? onPressViewSchedule ?? onPressRow;

      const pendingCount = useMemo(
        () => items.filter(i => !i.showCompletedCheck).length,
        [items],
      );

      return (
        <WidgetSurface theme={theme}>
          <View style={{ gap: spacing.md }}>
            <View style={styles.sectionHead}>
              <View style={styles.titleBlock}>
                <AppText
                  style={[
                    textStyles.title,
                    {
                      color: colors.text.heading,
                      fontFamily: fontFamilies.extrabold,
                      fontSize: 20,
                    },
                  ]}
                >
                  Tasks
                </AppText>
              </View>
              {!loading && items.length > 0 ? (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: colors.brandTint12,
                      borderRadius: r.pill,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xxs,
                    },
                  ]}
                >
                  <AppText
                    style={[
                      textStyles.caption,
                      {
                        color: colors.primaryDark,
                        fontFamily: fontFamilies.bold,
                      },
                    ]}
                  >
                    {pendingCount} Left
                  </AppText>
                </View>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="More options"
                hitSlop={12}
                onPress={menuAction}
                android_ripple={{ color: colors.brandTint20, borderless: true }}
                style={({ pressed }) => ({
                  padding: spacing.xs,
                  opacity: pressed ? 0.65 : 1,
                })}
              >
                <MaterialIcon
                  name="more_vert"
                  size={22}
                  color={colors.text.secondary}
                />
              </Pressable>
            </View>

            {loading ? (
              <View
                style={[
                  styles.loader,
                  {
                    paddingVertical: spacing.xl,
                    borderRadius: r.xl,
                    backgroundColor: colors.surfaceAlt,
                  },
                ]}
              >
                <ActivityIndicator color={colors.primary} size="small" />
              </View>
            ) : null}

            {!loading && items.length === 0 ? (
              <View style={{ gap: spacing.md }}>
                <AppText
                  style={[
                    textStyles.body,
                    {
                      color: colors.text.secondary,
                      textAlign: 'center',
                    },
                  ]}
                >
                  Nothing scheduled for today. Add a task to stay on track.
                </AppText>
                <Pressable
                  onPress={onPressAddTask}
                  android_ripple={{ color: colors.brandTint20 }}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.88 : 1,
                  })}
                >
                  <View
                    style={[
                      styles.softAdd,
                      {
                        borderRadius: r.xl,
                        backgroundColor: colors.brandTint12,
                        borderWidth: 1,
                        borderColor: colors.brandTint20,
                        paddingVertical: spacing.md,
                      },
                    ]}
                  >
                    <AppText
                      style={[
                        textStyles.subtitle,
                        {
                          color: colors.primaryDark,
                          fontFamily: fontFamilies.bold,
                        },
                      ]}
                    >
                      + Add New Task
                    </AppText>
                  </View>
                </Pressable>
              </View>
            ) : null}

            {!loading && items.length > 0 ? (
              <View style={{ gap: spacing.sm }}>
                {items.map(item => {
                  const done = item.showCompletedCheck;
                  const trail = trailingIconForType(item.reminder.type);
                  return (
                    <Pressable
                      key={item.reminder.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.reminder.title}, ${done ? doneSubtitle(item) : taskSubtitle(item)}`}
                      onPress={onPressRow}
                      android_ripple={{ color: colors.brandTint20 }}
                      style={({ pressed }) => [
                        styles.row,
                        {
                          backgroundColor: colors.surfaceAlt,
                          borderRadius: r.xl,
                          paddingVertical: spacing.md,
                          paddingHorizontal: spacing.md,
                          borderWidth: 1,
                          borderColor: colors.borderSubtle,
                          opacity: pressed ? (Platform.OS === 'ios' ? 0.92 : 1) : 1,
                        },
                      ]}
                    >
                      {done ? (
                        <View
                          style={[
                            styles.checkOn,
                            {
                              width: 22,
                              height: 22,
                              borderRadius: r.sm,
                              backgroundColor: colors.primary,
                            },
                          ]}
                        >
                          <MaterialIcon
                            name="check"
                            size={16}
                            color={colors.text.inverse}
                          />
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.checkOff,
                            {
                              width: 22,
                              height: 22,
                              borderRadius: r.sm,
                              borderWidth: 2,
                              borderColor: colors.primary,
                            },
                          ]}
                        />
                      )}
                      <View style={styles.rowText}>
                        <AppText
                          style={[
                            textStyles.subtitle,
                            {
                              color: done
                                ? colors.text.muted
                                : colors.text.heading,
                              fontFamily: fontFamilies.bold,
                            },
                          ]}
                          numberOfLines={2}
                        >
                          {item.reminder.title}
                        </AppText>
                        <AppText
                          style={[
                            textStyles.footer,
                            {
                              color: colors.text.muted,
                              marginTop: 2,
                              fontStyle: done ? 'italic' : 'normal',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {done ? doneSubtitle(item) : taskSubtitle(item)}
                        </AppText>
                      </View>
                      <MaterialIcon
                        name={trail}
                        size={22}
                        color={colors.primary}
                      />
                    </Pressable>
                  );
                })}

                <Pressable
                  onPress={onPressAddTask}
                  android_ripple={{ color: colors.brandTint20 }}
                  style={({ pressed }) => ({
                    marginTop: spacing.xs,
                    opacity: pressed ? 0.88 : 1,
                  })}
                >
                  <View
                    style={[
                      styles.softAdd,
                      {
                        borderRadius: r.xl,
                        backgroundColor: colors.brandTint12,
                        borderWidth: 1,
                        borderColor: colors.brandTint20,
                        paddingVertical: spacing.md,
                      },
                    ]}
                  >
                    <AppText
                      style={[
                        textStyles.subtitle,
                        {
                          color: colors.primaryDark,
                          fontFamily: fontFamilies.bold,
                        },
                      ]}
                    >
                      + Add New Task
                    </AppText>
                  </View>
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
    gap: spacingTokens.sm,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  badge: {},
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  checkOn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOff: {},
  softAdd: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
