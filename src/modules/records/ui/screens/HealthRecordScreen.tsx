import React, { useEffect, useMemo, useState } from 'react';
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
import type { SmartHealthRecord } from '../../domain/models/SmartHealthRecord';
import { PremiumUpgradeCard } from '../components/PremiumUpgradeCard';
import { SmartHealthRecordItem } from '../components/SmartHealthRecordItem';
import { partitionCareRecordsForUi, weeksBetweenDobAndToday } from '../utils/healthRecordScreenPartition';

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
  const { colors, space, spacing, radius, textStyles, fontFamilies } = theme;

  const activePet = usePetStore(s => s.activePet);
  const loading = useSmartHealthRecordStore(s => s.loading);
  const error = useSmartHealthRecordStore(s => s.error);
  const records = useSmartHealthRecordStore(s => s.records);
  const bootstrapPetSchedule = useSmartHealthRecordStore(
    s => s.bootstrapPetSchedule,
  );
  const loadPetRecords = useSmartHealthRecordStore(s => s.loadPetRecords);
  const markAsDone = useSmartHealthRecordStore(s => s.markAsDone);
  const remindTask = useSmartHealthRecordStore(s => s.remindTask);
  const reschedule = useSmartHealthRecordStore(s => s.reschedule);
  const getByType = useSmartHealthRecordStore(s => s.getByType);
  const getActionRequiredItems = useSmartHealthRecordStore(
    s => s.getActionRequiredItems,
  );
  const getUpcomingItems = useSmartHealthRecordStore(s => s.getUpcomingItems);

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('Vaccination');
  const [editingRecord, setEditingRecord] = useState<SmartHealthRecord | null>(null);
  const [editingDueDate, setEditingDueDate] = useState('');
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (!activePet) return;
      void loadPetRecords(activePet.id).catch(() => {});
    }, [activePet?.id, loadPetRecords]),
  );

  useEffect(() => {
    if (!activePet) return;
    void bootstrapPetSchedule({
      petId: activePet.id,
      petType: activePet.type,
      dateOfBirth: activePet.dob ?? new Date().toISOString().slice(0, 10),
      region: activePet.region,
      lifestyleType: activePet.lifestyle?.type,
      lifestyleRiskLevel: activePet.lifestyle?.riskLevel,
    })
      .then(() => loadPetRecords(activePet.id))
      .catch(() => {});
  }, [
    activePet?.id,
    activePet?.type,
    activePet?.dob,
    bootstrapPetSchedule,
    loadPetRecords,
  ]);

  const tabType = selectedCategory === 'Vaccination' ? 'vaccination' : 'deworming';

  const recordsByType = useMemo(
    () => getByType(tabType),
    [getByType, records, tabType],
  );

  const filtered = useMemo(
    () =>
      recordsByType.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [recordsByType],
  );

  const partitioned = useMemo(() => partitionCareRecordsForUi(filtered), [filtered]);
  const actionRequiredItems = useMemo(
    () => getActionRequiredItems(tabType, 2),
    [getActionRequiredItems, tabType, records],
  );
  const primaryTask = actionRequiredItems[0] ?? null;
  const secondaryActionTask = actionRequiredItems[1] ?? null;
  const upcomingItems = useMemo(() => {
    const hiddenIds = new Set(actionRequiredItems.map(item => item.id));
    return getUpcomingItems(tabType, { limit: 5, dedupeByFamily: true }).filter(
      item => !hiddenIds.has(item.id),
    );
  }, [actionRequiredItems, getUpcomingItems, tabType, records]);

  const completedRecords = partitioned.history;

  const petAgeWeeks = useMemo(
    () => weeksBetweenDobAndToday(activePet?.dob ?? ''),
    [activePet?.dob],
  );

  const summaryLine = useMemo(() => {
    const od = partitioned.overdue.length;
    const comp = partitioned.history.length;
    const dueSoon = partitioned.dueSoon.length;
    const fut = partitioned.futureSchedule.length;
    const scheduled = dueSoon + fut;
    return `${od} overdue · ${comp} completed · ${scheduled} scheduled`;
  }, [partitioned]);

  const nextDewormingFallbackDate = useMemo((): string | null => {
    if (selectedCategory !== 'Deworming') return null;
    if (primaryTask || secondaryActionTask || upcomingItems.length > 0) return null;
    const latestCompleted = completedRecords
      .slice()
      .sort((a, b) =>
        (b.completedDate ?? b.dueDate).localeCompare(a.completedDate ?? a.dueDate),
      )[0];
    if (!latestCompleted) return null;
    return addMonthsToIsoDate(latestCompleted.completedDate ?? latestCompleted.dueDate, 3);
  }, [
    selectedCategory,
    primaryTask,
    secondaryActionTask,
    upcomingItems.length,
    completedRecords,
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
            { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
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
          <AppText style={[textStyles.body, { color: colors.text.secondary, textAlign: 'center' }]}>
            Add a pet profile to generate automatic health schedules.
          </AppText>
        </View>
        </View>
      </SafeAreaView>
    );
  }

  const logPrimaryCtaLabel =
    primaryTask?.type === 'vaccination' ? 'Log Vaccination' : 'Log Deworming';

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
              { backgroundColor: colors.brandTint10, borderRadius: radius.round },
            ]}
          >
            <MaterialIcon name="arrow_back" size={20} color={colors.accent} />
          </Pressable>

          <View style={styles.headerTitleBlock}>
            <AppText
              style={[
                textStyles.title,
                { color: colors.text.heading, fontFamily: fontFamilies.extrabold },
              ]}
              numberOfLines={1}
            >
              {activePet.name}
            </AppText>
            <AppText
              style={[
                textStyles.caption,
                { color: colors.text.secondary, fontFamily: fontFamilies.medium },
              ]}
              numberOfLines={1}
            >
              {petAgeWeeks !== null
                ? `${petAgeWeeks} weeks old · ${summaryLine}`
                : summaryLine}
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
            return (
              <Pressable
                key={category}
                accessibilityRole="button"
                accessibilityLabel={`Filter: ${category}`}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.tab,
                  {
                    borderBottomColor: selected ? colors.accent : colors.borderSubtle,
                    borderBottomWidth: 2,
                  },
                ]}
              >
                <AppText
                  style={[
                    textStyles.caption,
                    {
                      color: selected ? colors.accent : colors.text.subdued,
                      fontFamily: selected ? fontFamilies.bold : fontFamilies.medium,
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
              <AppText style={[textStyles.overline, { color: colors.text.subdued }]}>
                ACTION REQUIRED
              </AppText>
            </View>

            {!primaryTask && !nextDewormingFallbackDate ? (
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
                    { color: colors.text.secondary, fontFamily: fontFamilies.medium },
                  ]}
                >
                  No urgent items — you are caught up for this tab.
                </AppText>
              </View>
            ) : null}

            {primaryTask ? (
              <SmartHealthRecordItem
                record={primaryTask}
                variant="hero"
                primaryActionLabel={logPrimaryCtaLabel}
                onMarkDone={() => {
                  void markAsDone(primaryTask.id);
                }}
                onRemind={() => {
                  void remindTask(primaryTask.id);
                }}
              />
            ) : null}

            {secondaryActionTask ? (
              <View style={{ marginTop: space('lg') }}>
                <View style={{ marginBottom: space('sm') }}>
                  <SmartHealthRecordItem
                    record={secondaryActionTask}
                    onMarkDone={() => {
                      void markAsDone(secondaryActionTask.id);
                    }}
                    onRemind={() => {
                      void remindTask(secondaryActionTask.id);
                    }}
                  />
                </View>
              </View>
            ) : null}

            <View style={{ marginTop: space('lg') }}>
              <AppText style={[textStyles.overline, { color: colors.text.subdued }]}>
                UPCOMING
              </AppText>
              <View style={{ height: space('sm') }} />
              {upcomingItems.length > 0 ? (
                upcomingItems.map(item => (
                  <View key={item.id} style={{ marginBottom: space('sm') }}>
                    <SmartHealthRecordItem record={item} />
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
                      { color: colors.text.secondary, fontFamily: fontFamilies.medium },
                    ]}
                  >
                    Next deworming estimate: {formatUiDate(nextDewormingFallbackDate)}
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
                      { color: colors.text.secondary, fontFamily: fontFamilies.medium },
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
                <AppText style={[textStyles.overline, { color: colors.text.subdued }]}>
                  HISTORY ({completedRecords.length})
                </AppText>
                <AppText
                  style={[
                    textStyles.caption,
                    { color: colors.text.subdued, fontFamily: fontFamilies.medium },
                  ]}
                >
                  {isCompletedExpanded ? 'Hide' : 'Show'}
                </AppText>
              </Pressable>
              {isCompletedExpanded ? (
                <View style={{ marginTop: space('sm') }}>
                  {completedRecords.length > 0 ? (
                    completedRecords.map(item => (
                      <View key={item.id} style={{ marginBottom: space('sm') }}>
                        <SmartHealthRecordItem
                          record={item}
                          onEditDate={() => openUpdateDate(item)}
                        />
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
                        style={[textStyles.caption, { color: colors.text.secondary }]}
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
                    { color: colors.text.secondary, fontFamily: fontFamilies.medium },
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
        <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
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
              <DatePickerField value={editingDueDate} onChange={setEditingDueDate} />
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
                    { color: colors.text.secondary, fontFamily: fontFamilies.bold },
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
                    { color: colors.text.inverse, fontFamily: fontFamilies.bold },
                  ]}
                >
                  Save
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

