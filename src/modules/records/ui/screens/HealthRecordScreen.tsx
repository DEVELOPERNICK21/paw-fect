import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
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

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('Vaccination');
  const [search, setSearch] = useState('');
  const [editingRecord, setEditingRecord] = useState<SmartHealthRecord | null>(null);
  const [editingDueDate, setEditingDueDate] = useState('');
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
  const [isFullScheduleExpanded, setIsFullScheduleExpanded] = useState(false);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recordsByType
      .filter(item => {
        if (!q) return true;
        return item.name.toLowerCase().includes(q);
      })
      .slice()
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [recordsByType, search]);

  const nextActionTask = useMemo((): SmartHealthRecord | null => {
    const urgent = filtered
      .filter(
        item => item.status === 'overdue' || item.status === 'upcoming',
      )
      .slice()
      .sort((a, b) => {
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (b.status === 'overdue' && a.status !== 'overdue') return 1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    return urgent[0] ?? null;
  }, [filtered]);

  const upcomingShortList = useMemo(
    () =>
      filtered
        .filter(item => item.status === 'upcoming' || item.status === 'overdue')
        .filter(item => item.id !== nextActionTask?.id)
        .slice(0, 3),
    [filtered, nextActionTask?.id],
  );

  const completedRecords = useMemo(
    () => filtered.filter(item => item.status === 'completed'),
    [filtered],
  );

  const nextDewormingFallbackDate = useMemo((): string | null => {
    if (selectedCategory !== 'Deworming') return null;
    if (nextActionTask) return null;

    const latestCompleted = completedRecords
      .slice()
      .sort((a, b) => (b.completedDate ?? b.dueDate).localeCompare(a.completedDate ?? a.dueDate))[0];

    if (!latestCompleted) return null;
    return addMonthsToIsoDate(latestCompleted.completedDate ?? latestCompleted.dueDate, 3);
  }, [selectedCategory, nextActionTask, completedRecords]);

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

  const nextDueColor =
    nextActionTask?.status === 'overdue' ? colors.danger : colors.warning;

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

          <AppText
            style={[
              textStyles.title,
              { color: colors.text.heading, fontFamily: fontFamilies.extrabold },
            ]}
            numberOfLines={1}
          >
            Health Records
          </AppText>

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

        <View style={[styles.searchWrap, { backgroundColor: colors.surface }]}>
          <View style={styles.searchIconWrap}>
            <icons.searchIcon width={18} height={18} color={colors.text.subdued} />
          </View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by vaccine or record name..."
            placeholderTextColor={colors.input.placeholder}
            style={[
              styles.searchInput,
              { color: colors.text.body, fontFamily: fontFamilies.regular },
            ]}
          />
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
            <View style={{ marginTop: space('lg') }}>
              <AppText style={[textStyles.overline, { color: colors.text.subdued }]}>
                ACTION REQUIRED
              </AppText>
            </View>

            {nextActionTask ? (
              <View
                style={[
                  styles.nextDueCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.brandTint10,
                    borderRadius: radius.lg,
                    padding: space('lg'),
                  },
                ]}
              >
                <View style={styles.nextDueRow}>
                  <View
                    style={[
                      styles.nextDueIconCircle,
                      {
                        borderRadius: radius.round,
                        backgroundColor: colors.brandTint10,
                        width: spacing['4xl'],
                        height: spacing['4xl'],
                      },
                    ]}
                  >
                    <MaterialIcon name="schedule" size={22} color={nextDueColor} />
                  </View>

                  <View style={styles.nextDueInfo}>
                    <AppText style={[textStyles.overline, { color: nextDueColor, fontFamily: fontFamilies.bold }]}>
                      NEXT DUE
                    </AppText>
                    <AppText
                      style={[
                        textStyles.title,
                        {
                          color: colors.text.heading,
                          fontFamily: fontFamilies.extrabold,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {nextActionTask.name}
                    </AppText>
                    <AppText
                      style={[
                        textStyles.caption,
                        { color: colors.text.secondary, fontFamily: fontFamilies.medium },
                      ]}
                    >
                      Due on {formatUiDate(nextActionTask.dueDate)}
                    </AppText>
                  </View>

                  <View style={[styles.nextDueActions, { gap: space('sm') }]}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Mark next action as done"
                      onPress={() => {
                        void markAsDone(nextActionTask.id);
                      }}
                      style={({ pressed }) => [
                        styles.nextDueActionBtn,
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
                          {
                            color: colors.text.inverse,
                            fontFamily: fontFamilies.bold,
                          },
                        ]}
                      >
                        Mark as Done
                      </AppText>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Remind me about next action"
                      onPress={() => {
                        void remindTask(nextActionTask.id);
                      }}
                      style={({ pressed }) => [
                        styles.nextDueActionBtn,
                        {
                          borderRadius: radius.round,
                          borderColor: colors.borderSubtle,
                          borderWidth: 1,
                          backgroundColor: colors.surfaceAlt,
                          opacity: pressed ? 0.9 : 1,
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
                        Remind Me
                      </AppText>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}

            {nextDewormingFallbackDate ? (
              <View
                style={[
                  styles.nextDueCard,
                  {
                    marginTop: nextActionTask ? space('md') : space('sm'),
                    backgroundColor: colors.surface,
                    borderColor: colors.brandTint10,
                    borderRadius: radius.lg,
                    padding: space('lg'),
                  },
                ]}
              >
                <View style={styles.nextDueRow}>
                  <View
                    style={[
                      styles.nextDueIconCircle,
                      {
                        borderRadius: radius.round,
                        backgroundColor: colors.brandTint10,
                        width: spacing['4xl'],
                        height: spacing['4xl'],
                      },
                    ]}
                  >
                    <icons.dewormIcon width={20} height={20} />
                  </View>
                  <View style={styles.nextDueInfo}>
                    <AppText
                      style={[
                        textStyles.overline,
                        { color: colors.warning, fontFamily: fontFamilies.bold },
                      ]}
                    >
                      NEXT DEWORMING
                    </AppText>
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
                      Quarterly cycle
                    </AppText>
                    <AppText
                      style={[
                        textStyles.caption,
                        { color: colors.text.secondary, fontFamily: fontFamilies.medium },
                      ]}
                    >
                      Due on {formatUiDate(nextDewormingFallbackDate)}
                    </AppText>
                  </View>
                </View>
              </View>
            ) : null}

            {upcomingShortList.length > 0 ? (
              <View style={{ marginTop: space('lg') }}>
                <AppText style={[textStyles.overline, { color: colors.text.subdued }]}>
                  UPCOMING
                </AppText>
                <View style={{ height: space('sm') }} />
                {upcomingShortList.map(item => (
                  <View key={item.id} style={{ marginBottom: space('sm') }}>
                    <SmartHealthRecordItem
                      record={item}
                      onUpdate={() => openUpdateDate(item)}
                    />
                  </View>
                ))}
              </View>
            ) : null}

            <View style={{ marginTop: space('lg') }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle completed records"
                onPress={() => setIsCompletedExpanded(prev => !prev)}
                style={styles.completedHeader}
              >
                <AppText style={[textStyles.overline, { color: colors.text.subdued }]}>
                  COMPLETED ({completedRecords.length})
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
                          onUpdate={() => openUpdateDate(item)}
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
                        No completed items
                      </AppText>
                    </View>
                  )}
                </View>
              ) : null}
            </View>

            <View style={{ marginTop: space('lg') }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle full schedule"
                onPress={() => setIsFullScheduleExpanded(prev => !prev)}
                style={styles.completedHeader}
              >
                <AppText style={[textStyles.overline, { color: colors.text.subdued }]}>
                  FULL SCHEDULE ({filtered.length})
                </AppText>
                <AppText
                  style={[
                    textStyles.caption,
                    { color: colors.text.subdued, fontFamily: fontFamilies.medium },
                  ]}
                >
                  {isFullScheduleExpanded ? 'Hide' : 'Show'}
                </AppText>
              </Pressable>
              {isFullScheduleExpanded ? (
                <View style={{ marginTop: space('sm') }}>
                  {filtered.map(item => (
                    <View key={`${item.id}-full`} style={{ marginBottom: space('sm') }}>
                      <SmartHealthRecordItem
                        record={item}
                        onUpdate={() => openUpdateDate(item)}
                      />
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={{ marginTop: space('lg') }}>
              <PremiumUpgradeCard />
            </View>

            {error ? (
              <View
                style={[
                  styles.errorCard,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: colors.borderSubtle,
                    marginTop: space('md'),
                  },
                ]}
              >
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
              Update due date
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
                  Update
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
  searchWrap: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchIconWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 14,
    lineHeight: 20,
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
  nextDueCard: {
    borderWidth: 1,
    gap: 8,
  },
  nextDueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nextDueIconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextDueInfo: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  nextDueActions: {
    alignItems: 'flex-end',
  },
  nextDueActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
    minHeight: 36,
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

