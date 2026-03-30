import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTabBarInset } from '../../../../app/navigation/layout';
import type { HealthRecordsRootNavigation } from '../../../../app/navigation/types';
import { Button } from '../../../../shared/components/Button';
import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon, type IconName } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { icons } from '../../../../shared/assets/icons';
import { usePetStore } from '../../../pets/store/petStore';
import { useRecordStore } from '../../store/recordStore';
import { useHealthScheduleStore } from '../../store/healthScheduleStore';
import type { HealthRecord } from '../../domain/models/HealthRecord';
import type { HealthSchedule } from '../../domain/models/HealthSchedule';
import { HealthScheduleEngine } from '../../domain/utils/HealthScheduleEngine';

import { HealthRecordListItem } from '../components/HealthRecordListItem';
import { PremiumUpgradeCard } from '../components/PremiumUpgradeCard';
import { UpcomingDueCard } from '../components/UpcomingDueCard';

type CategoryFilter = 'Vaccination' | 'Deworming';

const CATEGORIES: CategoryFilter[] = ['Vaccination', 'Deworming'];

const CATEGORY_ICON: Record<CategoryFilter, IconName> = {
  Vaccination: 'vaccines',
  Deworming: 'healing',
};

function formatDueDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const HealthRecordScreen: React.FC = () => {
  const navigation = useNavigation<HealthRecordsRootNavigation>();
  const tabBarInset = useAppTabBarInset();
  const theme = useTheme();
  const { colors, space, radius, textStyles, fontFamilies } = theme;

  const activePet = usePetStore(s => s.activePet);
  const petsLoading = usePetStore(s => s.loading);
  const petsError = usePetStore(s => s.loadError);

  const records = useRecordStore(s => s.records);
  const recordsLoading = useRecordStore(s => s.loading);
  const recordsError = useRecordStore(s => s.error);
  const loadRecords = useRecordStore(s => s.loadRecords);

  const schedules = useHealthScheduleStore(s => s.schedules);
  const schedulesLoading = useHealthScheduleStore(s => s.loading);
  const schedulesError = useHealthScheduleStore(s => s.error);
  const loadSchedules = useHealthScheduleStore(s => s.loadSchedules);
  const initializeSchedulesForPet = useHealthScheduleStore(
    s => s.initializeSchedulesForPet,
  );

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('Vaccination');
  const [search, setSearch] = useState('');

  const todayIsoDate = useMemo(
    () => new Date().toISOString().slice(0, 10),
    [],
  );

  // Refresh records and schedule freshness when screen gains focus.
  useFocusEffect(
    useCallback(() => {
      void loadRecords().catch(() => {});
    }, [loadRecords]),
  );

  // Initialize schedules for the active pet when the pet changes.
  useEffect(() => {
    if (!activePet) return;
    void initializeSchedulesForPet(activePet.id, activePet.type, activePet.dob)
      .then(() => loadSchedules().catch(() => {}))
      .catch(() => {});
  }, [activePet?.id, activePet?.type, activePet?.dob, initializeSchedulesForPet, loadSchedules]);

  const recordsForPet = useMemo(() => {
    if (!activePet) return [] as HealthRecord[];
    return records.filter(r => r.petId === activePet.id);
  }, [activePet, records]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredRecords = useMemo(() => {
    const cat = selectedCategory.toLowerCase();
    return recordsForPet
      .filter(r => r.category.toLowerCase().includes(cat))
      .filter(r => {
        if (!normalizedSearch) return true;
        const haystack = `${r.title} ${r.category} ${r.notes}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      })
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [normalizedSearch, recordsForPet, selectedCategory]);

  const recentRecords = useMemo(() => filteredRecords.slice(0, 3), [filteredRecords]);

  const upcomingDueTask = useMemo((): HealthSchedule | null => {
    if (!activePet) return null;
    const upcoming = HealthScheduleEngine.getUpcomingTasks(schedules)
      .filter(s => s.petId === activePet.id)
      .slice()
      .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));

    if (upcoming.length === 0) return null;

    if (selectedCategory === 'Vaccination') {
      return (
        upcoming.find(
          s => s.taskType === 'vaccination' && s.vaccineType === 'rabies',
        ) ??
        upcoming.find(s => s.taskType === 'vaccination') ??
        upcoming[0]
      );
    }

    return upcoming.find(s => s.taskType === 'deworming') ?? upcoming[0];
  }, [activePet, schedules, selectedCategory]);

  const dueTitle = useMemo(() => {
    if (!upcomingDueTask) return '';
    if (upcomingDueTask.taskType === 'vaccination' && upcomingDueTask.vaccineType === 'rabies') {
      return 'Rabies Booster';
    }
    return upcomingDueTask.taskName;
  }, [upcomingDueTask]);

  const dueLabel = useMemo(() => {
    if (!upcomingDueTask) return '';
    return `Due on ${formatDueDateLabel(upcomingDueTask.nextDueDate)}`;
  }, [upcomingDueTask]);

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('HomeTab', { screen: 'Home' });
  }, [navigation]);

  const handleLearnMore = useCallback(() => {
    // No premium flow exists in this codebase yet.
  }, []);

  const showInitialLoading = petsLoading || recordsLoading && recordsForPet.length === 0;

  if (!activePet && showInitialLoading) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}
      >
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (petsError && !activePet) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}
      >
        <View style={styles.center}>
          <AppText
            style={[
              textStyles.subtitle,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
          >
            {petsError}
          </AppText>
          <View style={{ height: space('md') }} />
          <Button title="Retry" onPress={() => void loadRecords().catch(() => {})} />
        </View>
      </SafeAreaView>
    );
  }

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
              Add a pet profile to see your health records.
            </AppText>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
            onPress={goBack}
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
            style={[styles.addBtn, { backgroundColor: colors.accent, borderRadius: radius.round }]}
          >
            <MaterialIcon name="add" size={20} color={colors.text.inverse} />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <View style={styles.searchIconWrap}>
            <icons.searchIcon width={18} height={18} color={colors.text.subdued} />
          </View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by vaccine, clinic or vet..."
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
                    borderBottomWidth: selected ? 2 : 2,
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
        data={recentRecords}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: tabBarInset + space('2xl'),
          },
        ]}
        ListHeaderComponent={
          <View>
            {upcomingDueTask ? (
              <UpcomingDueCard
                iconName="repeat"
                title={dueTitle}
                dueLabel={dueLabel}
                onPressUpdate={() => {}}
              />
            ) : null}

            <View style={styles.sectionHeaderRow}>
              <AppText style={[textStyles.overline, { color: colors.text.subdued }]}>
                RECENT RECORDS
              </AppText>
            </View>
          </View>
        }
        ListEmptyComponent={
          recordsError || schedulesError ? null : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <icons.noRecordsIcon
                  width={180}
                  height={180}
                  color={colors.accent}
                />
              </View>
              <AppText
                style={[
                  textStyles.subtitle,
                  { color: colors.text.heading, fontFamily: fontFamilies.bold },
                ]}
              >
                No {selectedCategory} Records Yet
              </AppText>
              <AppText
                style={[
                  textStyles.body,
                  {
                    color: colors.text.secondary,
                    fontFamily: fontFamilies.medium,
                    textAlign: 'center',
                  },
                ]}
              >
                Tap the + button to add your first{' '}
                {selectedCategory === 'Vaccination'
                  ? 'vaccination record'
                  : 'deworming record'}
              </AppText>
            </View>
          )
        }
        renderItem={({ item }) => (
          <HealthRecordListItem
            record={item}
            iconName={CATEGORY_ICON[selectedCategory]}
            todayIsoDate={todayIsoDate}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: space('sm') }} />}
        ListFooterComponent={
          <View style={{ marginTop: space('lg') }}>
            <PremiumUpgradeCard />
            <View style={{ height: space('lg') }} />
            {recordsError ? (
              <View style={[styles.errorCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.borderSubtle }]}>
                <MaterialIcon name="info" size={22} color={colors.accent} />
                <AppText
                  style={[
                    textStyles.body,
                    { color: colors.text.secondary, fontFamily: fontFamilies.medium },
                  ]}
                >
                  {recordsError}
                </AppText>
              </View>
            ) : null}
            {schedulesError ? (
              <View style={[styles.errorCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.borderSubtle }]}>
                <MaterialIcon name="info" size={22} color={colors.accent} />
                <AppText
                  style={[
                    textStyles.body,
                    { color: colors.text.secondary, fontFamily: fontFamilies.medium },
                  ]}
                >
                  {schedulesError}
                </AppText>
              </View>
            ) : null}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {(recordsLoading || schedulesLoading) && recentRecords.length === 0 ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Learn more about Premium"
        onPress={handleLearnMore}
        style={styles.invisibleOverlay}
      />
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
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  tab: {
    flex: 1,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },
  sectionHeaderRow: {
    marginTop: 6,
    marginBottom: 4,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 180,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invisibleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
});

export default HealthRecordScreen;

