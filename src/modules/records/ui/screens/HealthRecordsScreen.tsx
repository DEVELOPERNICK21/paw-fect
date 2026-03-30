import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAppTabBarInset } from '../../../../app/navigation/layout';
import type { HealthRecordsRootNavigation } from '../../../../app/navigation/types';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme, type Theme } from '../../../../shared/hooks/useTheme';
import { usePetStore } from '../../../pets/store/petStore';
import { useHealthScheduleStore } from '../../store/healthScheduleStore';
import { HealthScheduleEngine } from '../../domain/utils/HealthScheduleEngine';
import type {
  HealthSchedule,
  TaskUrgency,
} from '../../domain/models/HealthSchedule';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_WIDTH = (SCREEN_WIDTH - 32) / 2;

type TabType = 'Vaccination' | 'Deworming';
const TABS: TabType[] = ['Vaccination', 'Deworming'];

interface ActionTask {
  schedule: HealthSchedule;
  urgency: TaskUrgency;
  daysUntil: number;
}

const createStyles = ({ colors }: Pick<Theme, 'colors'>) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.backgroundAlt },
    header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.brandTint10,
    },
    title: { fontSize: 24, lineHeight: 30, color: colors.text.heading },
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
    },
    tabWrapper: { marginTop: 8 },
    tabRow: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 10,
    },
    tabSelected: { backgroundColor: colors.accent },
    tabText: { fontSize: 14, fontWeight: '600', color: colors.text.secondary },
    tabTextSelected: { color: colors.text.inverse },
    content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
    statusCard: {
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    statusOnTrack: {
      backgroundColor: colors.successSurface,
      borderWidth: 1,
      borderColor: colors.success,
    },
    statusPending: {
      backgroundColor: colors.warning + '15',
      borderWidth: 1,
      borderColor: colors.warning,
    },
    statusOverdue: {
      backgroundColor: colors.danger + '15',
      borderWidth: 1,
      borderColor: colors.danger,
    },
    statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    statusIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusIconOnTrack: { backgroundColor: colors.success },
    statusIconPending: { backgroundColor: colors.warning },
    statusIconOverdue: { backgroundColor: colors.danger },
    statusText: { flex: 1 },
    statusLabel: { fontSize: 12, lineHeight: 16, color: colors.text.secondary },
    statusValue: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
    actionCard: {
      marginTop: 12,
      borderRadius: 16,
      padding: 16,
      borderWidth: 2,
    },
    actionCardOverdue: {
      backgroundColor: colors.danger + '08',
      borderColor: colors.danger,
    },
    actionCardDueSoon: {
      backgroundColor: colors.warning + '08',
      borderColor: colors.warning,
    },
    actionCardUpcoming: {
      backgroundColor: colors.accent + '08',
      borderColor: colors.accent,
    },
    actionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    actionBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    actionBadgeOverdue: { backgroundColor: colors.danger },
    actionBadgeDueSoon: { backgroundColor: colors.warning },
    actionBadgeUpcoming: { backgroundColor: colors.accent },
    actionBadgeText: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '700',
      color: colors.text.inverse,
    },
    actionTitle: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '700',
      color: colors.text.heading,
    },
    actionSubtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.secondary,
      marginTop: 2,
    },
    actionButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
    actionPrimaryBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    actionPrimaryOverdue: { backgroundColor: colors.danger },
    actionPrimaryDueSoon: { backgroundColor: colors.warning },
    actionPrimaryUpcoming: { backgroundColor: colors.accent },
    actionSecondaryBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      borderWidth: 1,
    },
    actionSecondaryOverdue: { borderColor: colors.danger },
    actionSecondaryDueSoon: { borderColor: colors.warning },
    actionSecondaryUpcoming: { borderColor: colors.accent },
    allClearCard: {
      marginTop: 12,
      borderRadius: 16,
      padding: 16,
      backgroundColor: colors.successSurface,
      borderWidth: 1,
      borderColor: colors.success,
    },
    allClearTitle: { fontSize: 18, fontWeight: '700', color: colors.success },
    allClearSubtitle: {
      fontSize: 14,
      color: colors.text.secondary,
      marginTop: 4,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 20,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '700',
      color: colors.text.heading,
    },
    sectionCount: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.brandTint10,
    },
    sectionCountText: { fontSize: 12, fontWeight: '600', color: colors.accent },
    taskCard: {
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: colors.surface,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 10,
    },
    taskCardOverdue: {
      borderColor: colors.danger + '40',
      backgroundColor: colors.danger + '08',
    },
    taskCardDueSoon: {
      borderColor: colors.warning + '40',
      backgroundColor: colors.warning + '08',
    },
    taskIcon: {
      width: 44,
      height: 44,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    taskIconVacc: { backgroundColor: colors.brandTint20 },
    taskIconDeworm: { backgroundColor: colors.successSurface },
    taskBody: { flex: 1 },
    taskName: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600',
      color: colors.text.heading,
    },
    taskDue: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.text.secondary,
      marginTop: 2,
    },
    taskActions: { flexDirection: 'row', gap: 8 },
    taskActionBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    historyToggle: {
      marginTop: 16,
      paddingVertical: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    historyToggleText: { fontSize: 14, color: colors.accent },
    historySection: { marginTop: 12 },
    historyCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surfaceAlt,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
      opacity: 0.7,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 40,
      paddingBottom: 24,
    },
    emptyTitle: {
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 6,
      color: colors.text.heading,
    },
    emptySubtitle: {
      fontSize: 14,
      textAlign: 'center',
      color: colors.text.muted,
      paddingHorizontal: 20,
    },
  });

function formatHumanDate(daysUntil: number): string {
  if (daysUntil < 0) {
    const absDays = Math.abs(daysUntil);
    if (absDays === 1) return 'Yesterday';
    return `${absDays} days ago`;
  }
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  return `In ${daysUntil} days`;
}

function getTaskUrgencyInfo(schedule: HealthSchedule): {
  urgency: TaskUrgency;
  daysUntil: number;
} {
  const daysUntil = HealthScheduleEngine.getDaysUntilDue(schedule.nextDueDate);
  const urgency = HealthScheduleEngine.getUrgency(
    schedule.nextDueDate,
    schedule.status,
  );
  return { urgency, daysUntil };
}

function sortByPriority(tasks: ActionTask[]): ActionTask[] {
  return [...tasks].sort((a, b) => {
    const priorityOrder: Record<TaskUrgency, number> = {
      overdue: 0,
      due_soon: 1,
      upcoming: 2,
      completed: 3,
    };
    if (priorityOrder[a.urgency] !== priorityOrder[b.urgency]) {
      return priorityOrder[a.urgency] - priorityOrder[b.urgency];
    }
    return a.daysUntil - b.daysUntil;
  });
}

export const HealthRecordsScreen: React.FC = () => {
  const navigation = useNavigation<HealthRecordsRootNavigation>();
  const tabBarInset = useAppTabBarInset();
  const { fontFamilies, colors } = useTheme();
  const styles = useMemo(() => createStyles({ colors }), [colors]);

  const activePet = usePetStore(state => state.activePet);
  const schedules = useHealthScheduleStore(state => state.schedules);
  const loadSchedules = useHealthScheduleStore(state => state.loadSchedules);
  const initializeSchedulesForPet = useHealthScheduleStore(
    state => state.initializeSchedulesForPet,
  );
  const completeSchedule = useHealthScheduleStore(
    state => state.completeSchedule,
  );

  const [tabIndex, setTabIndex] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  const indicatorAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (!activePet) return;
    const init = async () => {
      await initializeSchedulesForPet(
        activePet.id,
        activePet.type,
        activePet.dob ?? undefined,
      );
      await loadSchedules();
    };
    init().catch(() => {});
  }, [activePet, initializeSchedulesForPet, loadSchedules]);

  const goToTab = (index: number) => {
    setTabIndex(index);
    Animated.spring(indicatorAnim, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const activeSchedules = useMemo(() => {
    if (!activePet) return [];
    return schedules.filter(s => s.petId === activePet.id);
  }, [schedules, activePet]);

  const getTabSchedules = (tab: TabType) => {
    const taskType = tab === 'Vaccination' ? 'vaccination' : 'deworming';
    return activeSchedules.filter(s => s.taskType === taskType);
  };

  const currentTab = TABS[tabIndex];
  const tabSchedules = getTabSchedules(currentTab);

  const actionTasks: ActionTask[] = useMemo(() => {
    return tabSchedules
      .filter(
        s => s.isEnabled && s.status !== 'completed' && s.status !== 'skipped',
      )
      .map(schedule => {
        const { urgency, daysUntil } = getTaskUrgencyInfo(schedule);
        return { schedule, urgency, daysUntil };
      });
  }, [tabSchedules]);

  const sortedTasks = useMemo(() => sortByPriority(actionTasks), [actionTasks]);

  const overdueTasks = useMemo(
    () => sortedTasks.filter(t => t.urgency === 'overdue'),
    [sortedTasks],
  );
  const dueSoonTasks = useMemo(
    () => sortedTasks.filter(t => t.urgency === 'due_soon'),
    [sortedTasks],
  );
  const upcomingTasks = useMemo(
    () => sortedTasks.filter(t => t.urgency === 'upcoming' && t.daysUntil <= 7),
    [sortedTasks],
  );
  const historyTasks = useMemo(
    () =>
      tabSchedules.filter(
        s => s.status === 'completed' || s.status === 'skipped',
      ),
    [tabSchedules],
  );

  const totalPending =
    overdueTasks.length + dueSoonTasks.length + upcomingTasks.length;
  const primaryActionTask = sortedTasks[0] ?? null;

  const handleMarkDone = async (scheduleId: string) => {
    await completeSchedule(scheduleId);
  };

  const handleReschedule = () => {
    navigation.navigate('AddHealthRecord');
  };

  const getStatusStyle = () => {
    if (overdueTasks.length > 0) return styles.statusOverdue;
    if (dueSoonTasks.length > 0) return styles.statusPending;
    return styles.statusOnTrack;
  };

  const getStatusIconStyle = () => {
    if (overdueTasks.length > 0) return styles.statusIconOverdue;
    if (dueSoonTasks.length > 0) return styles.statusIconPending;
    return styles.statusIconOnTrack;
  };

  const getStatusText = () => {
    if (overdueTasks.length > 0) return `${overdueTasks.length} overdue`;
    if (dueSoonTasks.length > 0) return `${dueSoonTasks.length} due soon`;
    if (totalPending > 0) return `${totalPending} pending`;
    return 'All caught up!';
  };

  const getStatusColor = () => {
    if (overdueTasks.length > 0) return colors.danger;
    if (dueSoonTasks.length > 0) return colors.warning;
    return colors.success;
  };

  const getActionCardStyle = () => {
    if (!primaryActionTask) return '';
    if (primaryActionTask.urgency === 'overdue')
      return styles.actionCardOverdue;
    if (primaryActionTask.urgency === 'due_soon')
      return styles.actionCardDueSoon;
    return styles.actionCardUpcoming;
  };

  const getActionPrimaryStyle = () => {
    if (!primaryActionTask) return '';
    if (primaryActionTask.urgency === 'overdue')
      return styles.actionPrimaryOverdue;
    if (primaryActionTask.urgency === 'due_soon')
      return styles.actionPrimaryDueSoon;
    return styles.actionPrimaryUpcoming;
  };

  const getActionSecondaryStyle = () => {
    if (!primaryActionTask) return '';
    if (primaryActionTask.urgency === 'overdue')
      return styles.actionSecondaryOverdue;
    if (primaryActionTask.urgency === 'due_soon')
      return styles.actionSecondaryDueSoon;
    return styles.actionSecondaryUpcoming;
  };

  const getActionBadgeStyle = () => {
    if (!primaryActionTask) return '';
    if (primaryActionTask.urgency === 'overdue')
      return styles.actionBadgeOverdue;
    if (primaryActionTask.urgency === 'due_soon')
      return styles.actionBadgeDueSoon;
    return styles.actionBadgeUpcoming;
  };

  const getActionColor = () => {
    if (!primaryActionTask) return colors.accent;
    if (primaryActionTask.urgency === 'overdue') return colors.danger;
    if (primaryActionTask.urgency === 'due_soon') return colors.warning;
    return colors.accent;
  };

  const renderTaskCard = (task: ActionTask) => {
    const { schedule, urgency, daysUntil } = task;
    const isOverdue = urgency === 'overdue';
    const isDueSoon = urgency === 'due_soon';

    return (
      <View
        key={schedule.id}
        style={[
          styles.taskCard,
          isOverdue && styles.taskCardOverdue,
          isDueSoon && styles.taskCardDueSoon,
        ]}
      >
        <View
          style={[
            styles.taskIcon,
            schedule.taskType === 'vaccination'
              ? styles.taskIconVacc
              : styles.taskIconDeworm,
          ]}
        >
          <MaterialIcon
            name={schedule.taskType === 'vaccination' ? 'vaccines' : 'pill'}
            size={20}
            color={
              schedule.taskType === 'vaccination'
                ? colors.accent
                : colors.success
            }
          />
        </View>
        <View style={styles.taskBody}>
          <Text style={styles.taskName}>{schedule.taskName}</Text>
          <Text style={styles.taskDue}>{formatHumanDate(daysUntil)}</Text>
        </View>
        <View style={styles.taskActions}>
          <Pressable
            style={[styles.taskActionBtn, { borderColor: colors.success }]}
            onPress={() => handleMarkDone(schedule.id)}
          >
            <MaterialIcon name="check" size={18} color={colors.success} />
          </Pressable>
          <Pressable
            style={[styles.taskActionBtn, { borderColor: colors.text.muted }]}
            onPress={handleReschedule}
          >
            <MaterialIcon name="schedule" size={18} color={colors.text.muted} />
          </Pressable>
        </View>
      </View>
    );
  };

  const renderHistoryCard = (schedule: HealthSchedule) => (
    <View key={schedule.id} style={styles.historyCard}>
      <View
        style={[
          styles.taskIcon,
          schedule.taskType === 'vaccination'
            ? styles.taskIconVacc
            : styles.taskIconDeworm,
        ]}
      >
        <MaterialIcon
          name={schedule.taskType === 'vaccination' ? 'vaccines' : 'pill'}
          size={18}
          color={
            schedule.taskType === 'vaccination' ? colors.accent : colors.success
          }
        />
      </View>
      <View style={styles.taskBody}>
        <Text style={styles.taskName}>{schedule.taskName}</Text>
        <Text style={styles.taskDue}>
          {schedule.status === 'completed' ? 'Completed' : 'Skipped'}
        </Text>
      </View>
      <MaterialIcon name="check_circle" size={20} color={colors.success} />
    </View>
  );

  if (!activePet) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Pet Selected</Text>
          <Text style={styles.emptySubtitle}>
            Please add a pet first to track health records.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.titleWrap}>
            <Pressable
              style={styles.backBtn}
              onPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate('HomeTab', { screen: 'Home' })
              }
            >
              <MaterialIcon name="arrow_back" size={20} color={colors.accent} />
            </Pressable>
            <Text style={[styles.title, { fontFamily: fontFamilies.bold }]}>
              Health Dashboard
            </Text>
          </View>
          <Pressable
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddHealthRecord')}
          >
            <MaterialIcon name="add" size={20} color={colors.text.inverse} />
          </Pressable>
        </View>

        <View style={[styles.tabWrapper]}>
          <View style={styles.tabRow}>
            {TABS.map((tab, index) => {
              const selected = tabIndex === index;
              return (
                <Pressable
                  key={tab}
                  style={[styles.tab, selected && styles.tabSelected]}
                  onPress={() => goToTab(index)}
                >
                  <Text
                    style={[styles.tabText, selected && styles.tabTextSelected]}
                  >
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.statusCard, getStatusStyle()]}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusIcon, getStatusIconStyle()]}>
              <MaterialIcon
                name={totalPending === 0 ? 'check' : 'notifications'}
                size={24}
                color={colors.text.inverse}
              />
            </View>
            <View style={styles.statusText}>
              <Text
                style={[
                  styles.statusLabel,
                  { fontFamily: fontFamilies.medium },
                ]}
              >
                {activePet.name}'s Health
              </Text>
              <Text
                style={[
                  styles.statusValue,
                  { fontFamily: fontFamilies.bold, color: getStatusColor() },
                ]}
              >
                {getStatusText()}
              </Text>
            </View>
          </View>
          <MaterialIcon name="pets" size={28} color={getStatusColor()} />
        </View>

        {primaryActionTask && (
          <View style={[styles.actionCard, getActionCardStyle()]}>
            <View style={styles.actionHeader}>
              <View style={[styles.actionBadge, getActionBadgeStyle()]}>
                <Text style={styles.actionBadgeText}>
                  {primaryActionTask.urgency === 'overdue'
                    ? 'OVERDUE'
                    : primaryActionTask.urgency === 'due_soon'
                    ? 'DUE SOON'
                    : 'UPCOMING'}
                </Text>
              </View>
              <MaterialIcon
                name={
                  primaryActionTask.schedule.taskType === 'vaccination'
                    ? 'vaccines'
                    : 'pill'
                }
                size={20}
                color={getActionColor()}
              />
            </View>
            <Text
              style={[styles.actionTitle, { fontFamily: fontFamilies.bold }]}
            >
              {primaryActionTask.schedule.taskName}
            </Text>
            <Text
              style={[
                styles.actionSubtitle,
                { fontFamily: fontFamilies.medium },
              ]}
            >
              {formatHumanDate(primaryActionTask.daysUntil)}
            </Text>
            <View style={styles.actionButtons}>
              <Pressable
                style={[styles.actionPrimaryBtn, getActionPrimaryStyle()]}
                onPress={() => handleMarkDone(primaryActionTask.schedule.id)}
              >
                <MaterialIcon
                  name="check"
                  size={18}
                  color={colors.text.inverse}
                />
                <Text
                  style={{
                    fontFamily: fontFamilies.bold,
                    color: colors.text.inverse,
                    fontSize: 15,
                  }}
                >
                  Mark Done
                </Text>
              </Pressable>
              <Pressable
                style={[styles.actionSecondaryBtn, getActionSecondaryStyle()]}
                onPress={handleReschedule}
              >
                <MaterialIcon
                  name="schedule"
                  size={18}
                  color={getActionColor()}
                />
                <Text
                  style={{
                    fontFamily: fontFamilies.bold,
                    color: getActionColor(),
                    fontSize: 15,
                  }}
                >
                  Reschedule
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {totalPending === 0 && (
          <View style={styles.allClearCard}>
            <Text
              style={[styles.allClearTitle, { fontFamily: fontFamilies.bold }]}
            >
              {activePet.name} is up to date!
            </Text>
            <Text
              style={[
                styles.allClearSubtitle,
                { fontFamily: fontFamilies.medium },
              ]}
            >
              All {currentTab.toLowerCase()} tasks completed.
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarInset + 12 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {overdueTasks.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { fontFamily: fontFamilies.bold }]}
              >
                Overdue
              </Text>
              <View
                style={[
                  styles.sectionCount,
                  { backgroundColor: colors.danger + '20' },
                ]}
              >
                <Text
                  style={[styles.sectionCountText, { color: colors.danger }]}
                >
                  {overdueTasks.length}
                </Text>
              </View>
            </View>
            {overdueTasks.slice(0, 5).map(renderTaskCard)}
          </>
        )}

        {dueSoonTasks.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { fontFamily: fontFamilies.bold }]}
              >
                Due Soon (7 days)
              </Text>
              <View
                style={[
                  styles.sectionCount,
                  { backgroundColor: colors.warning + '20' },
                ]}
              >
                <Text
                  style={[styles.sectionCountText, { color: colors.warning }]}
                >
                  {dueSoonTasks.length}
                </Text>
              </View>
            </View>
            {dueSoonTasks.slice(0, 5).map(renderTaskCard)}
          </>
        )}

        {upcomingTasks.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { fontFamily: fontFamilies.bold }]}
              >
                Upcoming (7 days)
              </Text>
              <View style={styles.sectionCount}>
                <Text style={styles.sectionCountText}>
                  {upcomingTasks.length}
                </Text>
              </View>
            </View>
            {upcomingTasks.slice(0, 5).map(renderTaskCard)}
          </>
        )}

        {historyTasks.length > 0 && (
          <>
            <Pressable
              style={styles.historyToggle}
              onPress={() => setShowHistory(!showHistory)}
            >
              <Text
                style={[
                  styles.historyToggleText,
                  { fontFamily: fontFamilies.semibold },
                ]}
              >
                {showHistory
                  ? 'Hide History'
                  : `View History (${historyTasks.length})`}
              </Text>
              <MaterialIcon
                name={showHistory ? 'arrow_back' : 'arrow_forward'}
                size={20}
                color={colors.accent}
              />
            </Pressable>
            {showHistory && (
              <View style={styles.historySection}>
                {historyTasks.slice(0, 10).map(renderHistoryCard)}
              </View>
            )}
          </>
        )}

        {totalPending === 0 && historyTasks.length === 0 && (
          <View style={styles.emptyState}>
            <Text
              style={[styles.emptyTitle, { fontFamily: fontFamilies.bold }]}
            >
              No {currentTab} Records Yet
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { fontFamily: fontFamilies.medium },
              ]}
            >
              Add {activePet.name}'s first {currentTab.toLowerCase()} record.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HealthRecordsScreen;
