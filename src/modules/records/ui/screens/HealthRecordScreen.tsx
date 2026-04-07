import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTabBarInset } from '../../../../app/navigation/layout';
import type { HealthRecordsRootNavigation } from '../../../../app/navigation/types';
import { AppText } from '../../../../shared/components/AppText';
import { DatePickerField } from '../../../../shared/components/DatePickerField';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { icons } from '../../../../shared/assets/icons';
import { usePetStore } from '../../../pets/store/petStore';
import { useSmartHealthRecordStore } from '../../store/smartHealthRecordStore';
import { useDewormingStore } from '../../store/dewormingStore';
import type { SmartHealthRecord } from '../../domain/models/SmartHealthRecord';
import {
  cadenceDisplayLabel,
  validateLogDateForCadence,
} from '../../domain/utils/DewormingEngine';
import { PremiumUpgradeCard } from '../components/PremiumUpgradeCard';
import { SmartHealthRecordItem } from '../components/SmartHealthRecordItem';
import {
  partitionCareRecordsForUi,
  weeksBetweenDobAndToday,
} from '../utils/healthRecordScreenPartition';

type CategoryFilter = 'Vaccination' | 'Deworming';

const CATEGORIES: CategoryFilter[] = ['Vaccination', 'Deworming'];

const addMonthsToIsoDate = (isoDate: string, months: number): string => {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
};

export const HealthRecordScreen: React.FC = () => {
  const navigation = useNavigation<HealthRecordsRootNavigation>();
  const theme = useTheme();
  const tabBarInset = useAppTabBarInset();
  const { colors, space, radius, textStyles, fontFamilies } = theme;

  const activePet = usePetStore(s => s.activePet);
  const loading = useSmartHealthRecordStore(s => s.loading);
  const error = useSmartHealthRecordStore(s => s.error);
  const records = useSmartHealthRecordStore(s => s.records);
  const loadPetRecords = useSmartHealthRecordStore(s => s.loadPetRecords);
  const markAsDone = useSmartHealthRecordStore(s => s.markAsDone);
  const remindTask = useSmartHealthRecordStore(s => s.remindTask);
  const reschedule = useSmartHealthRecordStore(s => s.reschedule);
  const getByType = useSmartHealthRecordStore(s => s.getByType);
  const getActionRequiredItems = useSmartHealthRecordStore(
    s => s.getActionRequiredItems,
  );
  const getUpcomingItems = useSmartHealthRecordStore(s => s.getUpcomingItems);

  const dewormingResult = useDewormingStore(s => s.result);
  const dewormingHydrate = useDewormingStore(s => s.hydrateAndGenerate);

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('Vaccination');
  const [editingRecord, setEditingRecord] = useState<SmartHealthRecord | null>(
    null,
  );
  const [editingDueDate, setEditingDueDate] = useState('');
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

  const [showDewormingModal, setShowDewormingModal] = useState(false);
  const [selectedDewormingDate, setSelectedDewormingDate] = useState('');
  const [dewormingLogError, setDewormingLogError] = useState<string | null>(
    null,
  );

  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const dewormingLogCompletion = useDewormingStore(s => s.logCompletion);

  const handleMarkDewormingDone = () => {
    if (!displayPrimaryTask || !activePet?.dob || !todayDate) return;

    setDewormingLogError(null);
    setSelectedDewormingDate(todayDate);
    setShowDewormingModal(true);
  };

  const handleSaveDewormingDate = async () => {
    if (!selectedDewormingDate || !activePet?.dob || !displayPrimaryTask)
      return;

    const cadence = (displayPrimaryTask as unknown as { cadence?: string })
      .cadence;

    // Get last completion date from deworming store
    const dewormingCompleted =
      useDewormingStore.getState().result?.completed ?? [];
    const lastCompletionDate = dewormingCompleted[0]?.dueDate;

    const check = validateLogDateForCadence(
      activePet.dob,
      todayDate,
      selectedDewormingDate,
      (cadence ?? 'every_3_months') as
        | 'every_14_days'
        | 'monthly'
        | 'every_2_months'
        | 'every_3_months',
      lastCompletionDate,
    );

    if (!check.ok) {
      setDewormingLogError(check.error);
      return;
    }

    setDewormingLogError(null);
    await dewormingLogCompletion(selectedDewormingDate);
    setShowDewormingModal(false);
  };

  const isDewormingCategory = selectedCategory === 'Deworming';

  useFocusEffect(
    React.useCallback(() => {
      if (!activePet) return;
      void loadPetRecords(activePet.id).catch(() => {});
    }, [activePet?.id, loadPetRecords]),
  );

  useFocusEffect(
    React.useCallback(() => {
      if (isDewormingCategory && activePet?.dob) {
        void dewormingHydrate(activePet);
      }
    }, [isDewormingCategory, activePet?.dob]),
  );

  const tabType =
    selectedCategory === 'Vaccination' ? 'vaccination' : 'deworming';

  const recordsByType = useMemo(
    () => getByType(tabType),
    [getByType, records, tabType],
  );

  const filtered = useMemo(
    () =>
      recordsByType.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [recordsByType],
  );

  const partitioned = useMemo(
    () => partitionCareRecordsForUi(filtered),
    [filtered],
  );
  const actionRequiredItems = useMemo(
    () => getActionRequiredItems('vaccination', 1),
    [getActionRequiredItems, records],
  );
  const vaccinationPrimaryTask = actionRequiredItems[0] ?? null;
  const vaccinationUpcomingItems = useMemo(() => {
    const hiddenIds = new Set(actionRequiredItems.map(item => item.id));
    return getUpcomingItems('vaccination', {
      limit: 5,
      dedupeByFamily: false,
    }).filter(item => !hiddenIds.has(item.id));
  }, [actionRequiredItems, getUpcomingItems, records]);

  const dewormingNextStep = dewormingResult?.nextStep ?? null;
  const dewormingUpcoming = dewormingResult?.upcoming ?? [];
  const dewormingCompleted = dewormingResult?.completed ?? [];

  const displayPrimaryTask = isDewormingCategory
    ? dewormingNextStep
    : vaccinationPrimaryTask;
  const displayUpcomingItems = isDewormingCategory
    ? dewormingUpcoming
    : vaccinationUpcomingItems;
  const displayCompletedRecords = isDewormingCategory
    ? dewormingCompleted
    : partitioned.history;

  const canMarkDewormingDone = useMemo(() => {
    if (!isDewormingCategory || !displayPrimaryTask || !todayDate) return false;
    const dueDate = displayPrimaryTask.dueDate;
    const due = new Date(`${dueDate}T00:00:00`);
    const todayd = new Date(`${todayDate}T00:00:00`);
    const diffDays = Math.floor(
      (todayd.getTime() - due.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays >= -3;
  }, [isDewormingCategory, displayPrimaryTask, todayDate]);

  const petAgeWeeks = useMemo(
    () => weeksBetweenDobAndToday(activePet?.dob ?? ''),
    [activePet?.dob],
  );

  const summaryLine = useMemo(() => {
    if (isDewormingCategory && dewormingResult) {
      const pending = dewormingUpcoming.filter(
        i => i.status === 'pending',
      ).length;
      const missed = dewormingUpcoming.filter(
        i => i.status === 'missed',
      ).length;
      const completed = dewormingCompleted.length;
      return `${missed} overdue · ${completed} completed · ${pending} pending`;
    }
    const od = partitioned.overdue.length;
    const comp = partitioned.history.length;
    const dueSoon = partitioned.dueSoon.length;
    const fut = partitioned.futureSchedule.length;
    const scheduled = dueSoon + fut;
    return `${od} overdue · ${comp} completed · ${scheduled} scheduled`;
  }, [
    isDewormingCategory,
    dewormingResult,
    dewormingUpcoming,
    dewormingCompleted,
    partitioned,
  ]);

  const nextDewormingFallbackDate = useMemo((): string | null => {
    if (!isDewormingCategory) return null;
    if (dewormingNextStep || dewormingUpcoming.length > 0) return null;
    const latestCompleted = dewormingCompleted[0];
    if (!latestCompleted) return null;
    return addMonthsToIsoDate(latestCompleted.dueDate, 3);
  }, [
    isDewormingCategory,
    dewormingNextStep,
    dewormingUpcoming.length,
    dewormingCompleted,
  ]);

  const formatUiDate = (isoDate: string): string => {
    const date = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) return isoDate;
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!activePet) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}
      >
        <View style={styles.center}>
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <icons.paw width={40} height={40} />
            <AppText
              style={[
                textStyles.subtitle,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
            >
              No pet selected
            </AppText>
            <AppText
              style={[
                textStyles.body,
                { color: colors.text.secondary, textAlign: 'center' },
              ]}
            >
              Add a pet profile to generate automatic health schedules.
            </AppText>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const logPrimaryCtaLabel =
    selectedCategory === 'Vaccination' ? 'Log Vaccination' : 'Log Deworming';
  const completedCount = filtered.filter(
    item => item.status === 'completed',
  ).length;
  const totalCount = filtered.length;

  const openUpdateDate = (record: SmartHealthRecord): void => {
    setEditingRecord(record);
    setEditingDueDate(record.dueDate);
  };

  const closeUpdateDate = (): void => {
    setEditingRecord(null);
    setEditingDueDate('');
  };

  const applyDateUpdate = (): void => {
    if (!editingRecord || !editingDueDate) return;
    void reschedule(editingRecord.id, editingDueDate).finally(() => {
      closeUpdateDate();
    });
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}
    >
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
            style={[
              styles.backBtn,
              {
                backgroundColor: colors.brandTint10,
                borderRadius: radius.round,
              },
            ]}
          >
            <MaterialIcon name="arrow_back" size={20} color={colors.accent} />
          </Pressable>

          <View style={styles.headerTitleBlock}>
            <AppText
              style={[
                textStyles.title,
                {
                  color: colors.text.heading,
                  fontFamily: fontFamilies.extrabold,
                },
              ]}
              numberOfLines={1}
            >
              {activePet.name}
            </AppText>
            <AppText
              style={[
                textStyles.caption,
                {
                  color: colors.text.secondary,
                  fontFamily: fontFamilies.medium,
                },
              ]}
              numberOfLines={1}
            >
              {petAgeWeeks !== null
                ? `${petAgeWeeks} weeks old · ${summaryLine}`
                : summaryLine}
            </AppText>
            <AppText
              style={[
                textStyles.caption,
                { color: colors.text.subdued, fontFamily: fontFamilies.medium },
              ]}
              numberOfLines={1}
            >
              {selectedCategory} progress: {completedCount}/{totalCount}{' '}
              completed
            </AppText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add health record"
            onPress={() => navigation.navigate('AddHealthRecord')}
            style={[
              styles.addBtn,
              { backgroundColor: colors.accent, borderRadius: radius.round },
            ]}
          >
            <MaterialIcon name="add" size={20} color={colors.text.inverse} />
          </Pressable>
        </View>

        <View style={styles.tabsRow}>
          {CATEGORIES.map(category => {
            const selected = category === selectedCategory;
            const handleCategoryPress = () => {
              setSelectedCategory(category);
            };
            return (
              <Pressable
                key={category}
                accessibilityRole="button"
                accessibilityLabel={`Filter: ${category}`}
                onPress={handleCategoryPress}
                style={[
                  styles.tab,
                  {
                    borderBottomColor: selected
                      ? colors.accent
                      : colors.borderSubtle,
                    borderBottomWidth: 2,
                  },
                ]}
              >
                <AppText
                  style={[
                    textStyles.caption,
                    {
                      color: selected ? colors.accent : colors.text.subdued,
                      fontFamily: selected
                        ? fontFamilies.bold
                        : fontFamilies.medium,
                    },
                  ]}
                >
                  {category}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={[1]}
        keyExtractor={() => 'smart-health-list'}
        renderItem={() => (
          <View>
            <View style={{ marginTop: space('md') }}>
              <AppText
                style={[textStyles.overline, { color: colors.text.subdued }]}
              >
                NEXT STEP
              </AppText>
            </View>

            {!displayPrimaryTask && !nextDewormingFallbackDate ? (
              <View
                style={[
                  styles.emptyActionHint,
                  {
                    marginTop: space('sm'),
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                    borderRadius: radius.lg,
                    padding: space('md'),
                  },
                ]}
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
                  No urgent items — you are caught up for this tab.
                </AppText>
              </View>
            ) : null}

            {displayPrimaryTask && !isDewormingCategory ? (
              <SmartHealthRecordItem
                record={displayPrimaryTask as SmartHealthRecord}
                variant="hero"
                primaryActionLabel={logPrimaryCtaLabel}
                onMarkDone={() => {
                  void markAsDone(displayPrimaryTask.id);
                }}
                onRemind={() => {
                  void remindTask(displayPrimaryTask.id);
                }}
              />
            ) : isDewormingCategory && displayPrimaryTask ? (
              <View
                style={[
                  styles.emptyActionHint,
                  {
                    backgroundColor: colors.surface,
                    borderColor:
                      displayPrimaryTask.status === 'missed'
                        ? colors.danger
                        : colors.accent,
                    borderRadius: radius.lg,
                    padding: space('md'),
                  },
                ]}
              >
                <AppText
                  style={[textStyles.title, { color: colors.text.heading }]}
                >
                  Deworming{' '}
                  {displayPrimaryTask.status === 'missed' ? 'Overdue' : 'Due'}
                </AppText>
                <AppText
                  style={[textStyles.body, { color: colors.text.secondary }]}
                >
                  {formatUiDate(displayPrimaryTask.dueDate)}
                  {(displayPrimaryTask as unknown as { cadence?: string })
                    .cadence &&
                    ` · ${cadenceDisplayLabel(
                      (
                        displayPrimaryTask as unknown as {
                          cadence:
                            | 'every_14_days'
                            | 'monthly'
                            | 'every_2_months'
                            | 'every_3_months';
                        }
                      ).cadence,
                    )}`}
                </AppText>
                {canMarkDewormingDone ? (
                  <Pressable
                    style={[
                      styles.addBtn,
                      {
                        backgroundColor: colors.accent,
                        borderRadius: radius.round,
                        marginTop: space('sm'),
                      },
                    ]}
                    onPress={handleMarkDewormingDone}
                  >
                    <AppText
                      style={[
                        textStyles.caption,
                        {
                          color: colors.text.inverse,
                          fontFamily: fontFamilies.bold,
                        },
                      ]}
                    >
                      Mark as Done
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <View style={{ marginTop: space('lg') }}>
              <AppText
                style={[textStyles.overline, { color: colors.text.subdued }]}
              >
                COMING UP
              </AppText>
              <View style={{ height: space('sm') }} />
              {!isDewormingCategory && displayUpcomingItems.length > 0 ? (
                displayUpcomingItems.map(item => (
                  <View key={item.id} style={{ marginBottom: space('sm') }}>
                    <SmartHealthRecordItem record={item as SmartHealthRecord} />
                  </View>
                ))
              ) : isDewormingCategory && displayUpcomingItems.length > 0 ? (
                displayUpcomingItems.map(item => (
                  <View key={item.id} style={{ marginBottom: space('sm') }}>
                    <View
                      style={[
                        styles.emptyActionHint,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.borderSubtle,
                          padding: space('md'),
                        },
                      ]}
                    >
                      <AppText
                        style={[
                          textStyles.body,
                          { color: colors.text.heading },
                        ]}
                      >
                        Deworming
                      </AppText>
                      <AppText
                        style={[
                          textStyles.caption,
                          { color: colors.text.secondary },
                        ]}
                      >
                        {formatUiDate(item.dueDate)}
                        {(item as unknown as { cadence?: string }).cadence &&
                          ` · ${cadenceDisplayLabel(
                            (
                              item as unknown as {
                                cadence:
                                  | 'every_14_days'
                                  | 'monthly'
                                  | 'every_2_months'
                                  | 'every_3_months';
                              }
                            ).cadence,
                          )}`}
                      </AppText>
                    </View>
                  </View>
                ))
              ) : nextDewormingFallbackDate ? (
                <View
                  style={[
                    styles.emptyActionHint,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.borderSubtle,
                      borderRadius: radius.lg,
                      padding: space('md'),
                    },
                  ]}
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
                    Next deworming estimate:{' '}
                    {formatUiDate(nextDewormingFallbackDate)}
                  </AppText>
                </View>
              ) : (
                <View
                  style={[
                    styles.emptyActionHint,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.borderSubtle,
                      borderRadius: radius.lg,
                      padding: space('md'),
                    },
                  ]}
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
                    No upcoming items.
                  </AppText>
                </View>
              )}
            </View>

            <View style={{ marginTop: space('lg') }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle history records"
                onPress={() => setIsCompletedExpanded(prev => !prev)}
                style={styles.completedHeader}
              >
                <AppText
                  style={[textStyles.overline, { color: colors.text.subdued }]}
                >
                  HISTORY ({displayCompletedRecords.length})
                </AppText>
                <AppText
                  style={[
                    textStyles.caption,
                    {
                      color: colors.text.subdued,
                      fontFamily: fontFamilies.medium,
                    },
                  ]}
                >
                  {isCompletedExpanded ? 'Hide' : 'Show'}
                </AppText>
              </Pressable>
              {isCompletedExpanded ? (
                <View style={{ marginTop: space('sm') }}>
                  {displayCompletedRecords.length > 0 ? (
                    displayCompletedRecords.map(item => (
                      <View key={item.id} style={{ marginBottom: space('sm') }}>
                        {!isDewormingCategory ? (
                          <SmartHealthRecordItem
                            record={item as SmartHealthRecord}
                            onEditDate={() =>
                              openUpdateDate(item as SmartHealthRecord)
                            }
                          />
                        ) : (
                          <View
                            style={[
                              styles.emptyCard,
                              {
                                backgroundColor: colors.surface,
                                borderColor: colors.borderSubtle,
                              },
                            ]}
                          >
                            <AppText
                              style={[
                                textStyles.body,
                                { color: colors.text.heading },
                              ]}
                            >
                              Deworming Completed
                            </AppText>
                            <AppText
                              style={[
                                textStyles.caption,
                                { color: colors.text.secondary },
                              ]}
                            >
                              {formatUiDate(item.dueDate)}
                            </AppText>
                          </View>
                        )}
                      </View>
                    ))
                  ) : (
                    <View
                      style={[
                        styles.emptyCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <AppText
                        style={[
                          textStyles.caption,
                          { color: colors.text.secondary },
                        ]}
                      >
                        No history yet
                      </AppText>
                    </View>
                  )}
                </View>
              ) : null}
            </View>

            <View style={{ marginTop: space('2xl') }}>
              <PremiumUpgradeCard />
            </View>

            {error ? (
              <View style={{ marginTop: space('lg') }}>
                <MaterialIcon name="info" size={20} color={colors.accent} />
                <AppText
                  style={[
                    textStyles.caption,
                    {
                      color: colors.text.secondary,
                      fontFamily: fontFamilies.medium,
                    },
                  ]}
                >
                  {error}
                </AppText>
              </View>
            ) : null}
          </View>
        )}
        contentContainerStyle={{
          paddingHorizontal: space('lg'),
          paddingTop: space('md'),
          paddingBottom: tabBarInset + space('2xl'),
        }}
        showsVerticalScrollIndicator={false}
      />

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}

      <Modal
        transparent
        visible={Boolean(editingRecord)}
        animationType="fade"
        onRequestClose={closeUpdateDate}
      >
        <View
          style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
                borderRadius: radius.lg,
                padding: space('lg'),
              },
            ]}
          >
            <AppText
              style={[
                textStyles.subtitle,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
            >
              Edit due date
            </AppText>
            <View style={{ marginTop: space('sm') }}>
              <DatePickerField
                value={editingDueDate}
                onChange={setEditingDueDate}
              />
            </View>
            <View style={[styles.modalActions, { marginTop: space('md') }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel update"
                onPress={closeUpdateDate}
                style={[
                  styles.modalActionBtn,
                  {
                    borderRadius: radius.md,
                    borderColor: colors.borderSubtle,
                    backgroundColor: colors.surfaceAlt,
                  },
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
                  Cancel
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save due date update"
                onPress={applyDateUpdate}
                style={[
                  styles.modalActionBtn,
                  {
                    borderRadius: radius.md,
                    backgroundColor: colors.accent,
                  },
                ]}
              >
                <AppText
                  style={[
                    textStyles.caption,
                    {
                      color: colors.text.inverse,
                      fontFamily: fontFamilies.bold,
                    },
                  ]}
                >
                  Save
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {isDewormingCategory && (
        <Modal
          transparent
          visible={showDewormingModal}
          animationType="fade"
          onRequestClose={() => setShowDewormingModal(false)}
        >
          <View
            style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
          >
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                  borderRadius: 16,
                  padding: space('lg'),
                },
              ]}
            >
              <AppText
                style={[textStyles.subtitle, { color: colors.text.heading }]}
              >
                Log Deworming
              </AppText>
              <AppText
                style={[
                  textStyles.caption,
                  { color: colors.text.secondary, marginTop: space('xs') },
                ]}
              >
                Select the date you completed the deworming
              </AppText>

              <View style={{ marginTop: space('lg') }}>
                <DatePickerField
                  value={selectedDewormingDate}
                  onChange={setSelectedDewormingDate}
                  maximumDate={new Date()}
                />
              </View>

              {dewormingLogError ? (
                <AppText
                  style={[
                    textStyles.caption,
                    { color: colors.danger, marginTop: space('sm') },
                  ]}
                >
                  {dewormingLogError}
                </AppText>
              ) : null}

              <View style={[styles.modalActions, { marginTop: space('md') }]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowDewormingModal(false)}
                  style={[
                    styles.modalActionBtn,
                    {
                      borderRadius: 12,
                      borderColor: colors.borderSubtle,
                      backgroundColor: colors.surfaceAlt,
                    },
                  ]}
                >
                  <AppText
                    style={[
                      textStyles.caption,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Cancel
                  </AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleSaveDewormingDate}
                  style={[
                    styles.modalActionBtn,
                    { borderRadius: 12, backgroundColor: colors.accent },
                  ]}
                >
                  <AppText
                    style={[textStyles.caption, { color: colors.text.inverse }]}
                  >
                    Save
                  </AppText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  emptyActionHint: {
    borderWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  addBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabsRow: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
  },
  errorCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 44,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default HealthRecordScreen;
