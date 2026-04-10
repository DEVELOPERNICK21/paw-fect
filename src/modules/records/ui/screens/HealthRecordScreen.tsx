import React, { useMemo, useState } from 'react';
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
import { getTodayIsoDateLocal } from '../../../../shared/utils/calendarDate';
import { icons } from '../../../../shared/assets/icons';
import { usePetStore } from '../../../pets/store/petStore';
import { useSmartHealthRecordStore } from '../../store/smartHealthRecordStore';
import { type SmartHealthRecord } from '../../domain/models/SmartHealthRecord';
import { cadenceDisplayLabel, validateLogDateForCadence } from '../../domain/utils/DewormingEngine';
import {
  generateDewormingTimeline,
  projectDewormingTimelineSections,
} from '../../domain/utils/DewormingTimelineEngine';
import { PremiumUpgradeCard } from '../components/PremiumUpgradeCard';
import { SmartHealthRecordItem } from '../components/SmartHealthRecordItem';
import { weeksBetweenDobAndToday } from '../utils/healthRecordScreenPartition';

type CategoryFilter = 'Vaccination' | 'Deworming';

const CATEGORIES: CategoryFilter[] = ['Vaccination', 'Deworming'];

const addMonthsToIsoDate = (isoDate: string, months: number): string => {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
};

const addDaysToIsoDate = (isoDate: string, days: number): string => {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export const HealthRecordScreen: React.FC = () => {
  const navigation = useNavigation<HealthRecordsRootNavigation>();
  const theme = useTheme();
  const tabBarInset = useAppTabBarInset();
  const { colors, space, radius, textStyles, fontFamilies } = theme;

  const activePet = usePetStore(s => s.activePet);
  const records = useSmartHealthRecordStore(s => s.records);
  const loading = useSmartHealthRecordStore(s => s.loading);
  const error = useSmartHealthRecordStore(s => s.error);
  const markAsDone = useSmartHealthRecordStore.getState().markAsDone;
  const reschedule = useSmartHealthRecordStore(s => s.reschedule);
  const getNextVaccinationTask = useSmartHealthRecordStore(
    s => s.getNextVaccinationTask,
  );
  const getUpcomingVaccinations = useSmartHealthRecordStore(
    s => s.getUpcomingVaccinations,
  );

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
  const [showVaccinationModal, setShowVaccinationModal] = useState(false);
  const [selectedVaccinationDate, setSelectedVaccinationDate] = useState('');
  const [vaccinationLogError, setVaccinationLogError] = useState<string | null>(
    null,
  );
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipReasonInput, setSkipReasonInput] = useState('');
  const [skipError, setSkipError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Must match DatePickerField (which emits local YYYY-MM-DD).
  const todayDate = getTodayIsoDateLocal();

  const handleMarkDewormingDone = () => {
    if (!displayPrimaryTask || !activePet?.dob || !todayDate) return;

    setDewormingLogError(null);
    setSelectedDewormingDate(todayDate);
    setShowDewormingModal(true);
  };

  const handleSaveDewormingDate = async () => {
    if (!selectedDewormingDate || !activePet?.dob || !displayPrimaryTask)
      return;

    const cadence = displayPrimaryTask.cadence;
    const earlyWindowStart = addDaysToIsoDate(displayPrimaryTask.dueDate, -3);
    const isWithinMarkWindow =
      selectedDewormingDate >= earlyWindowStart &&
      selectedDewormingDate <= todayDate;

    const dewormingCompleted = records
      .filter(r => r.type === 'deworming' && r.status === 'completed')
      .sort((a, b) =>
        (b.completedDate ?? b.dueDate).localeCompare(a.completedDate ?? a.dueDate),
      );
    const lastCompletionDate =
      dewormingCompleted[0]?.completedDate ?? dewormingCompleted[0]?.dueDate;

    if (!isWithinMarkWindow) {
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
    }

    setDewormingLogError(null);
    await markAsDone(displayPrimaryTask.id, selectedDewormingDate);
    setShowDewormingModal(false);
    setSuccessMessage('Deworming log saved successfully.');
  };

  const isDewormingCategory = selectedCategory === 'Deworming';

  const handleMarkVaccinationDone = () => {
    if (!displayPrimaryTask || !todayDate) return;
    setVaccinationLogError(null);
    setSelectedVaccinationDate(todayDate);
    setShowVaccinationModal(true);
  };

  const handleSaveVaccinationDate = async () => {
    if (!displayPrimaryTask || !selectedVaccinationDate) return;
    if (selectedVaccinationDate > todayDate) {
      setVaccinationLogError('Vaccination date cannot be in the future.');
      return;
    }
    setVaccinationLogError(null);
    await markAsDone(displayPrimaryTask.id, selectedVaccinationDate);
    setShowVaccinationModal(false);
    setSuccessMessage('Vaccination log saved successfully.');
  };

  const closeVaccinationModal = (): void => {
    setShowVaccinationModal(false);
    setSelectedVaccinationDate('');
    setVaccinationLogError(null);
  };

  const closeDewormingModal = (): void => {
    setShowDewormingModal(false);
    setSelectedDewormingDate('');
    setDewormingLogError(null);
  };

  useFocusEffect(
    React.useCallback(() => {
      if (activePet?.id) {
        void useSmartHealthRecordStore.getState().loadPetRecords(activePet.id);
      }
    }, [activePet?.id]),
  );

  const tabType =
    selectedCategory === 'Vaccination' ? 'vaccination' : 'deworming';

  const recordsByType = useMemo(
    () =>
      records
        .filter(r => r.type === tabType)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [records, tabType],
  );

  const vaccinationRecords = useMemo(
    () =>
      records
        .filter(r => r.type === 'vaccination')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [records],
  );

  const dewormingRecords = useMemo(
    () =>
      records
        .filter(r => r.type === 'deworming')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [records],
  );
  const dewormingTimeline = useMemo(() => {
    if (!activePet?.id || !activePet?.dob) return [];
    const onboardingDate = (activePet.createdAt || todayDate).slice(0, 10);
    const history = dewormingRecords
      .filter(r => r.status === 'completed' || r.status === 'skipped')
      .map(r => ({
        date: (r.completedDate ?? r.dueDate).slice(0, 10),
        type: (r.status === 'completed' ? 'completed' : 'skipped') as
          | 'completed'
          | 'skipped',
        reason: r.skipReason ?? undefined,
      }));
    return generateDewormingTimeline(
      {
        id: activePet.id,
        dateOfBirth: activePet.dob,
        onboardingDate,
      },
      history,
      todayDate,
    );
  }, [activePet?.createdAt, activePet?.dob, activePet?.id, dewormingRecords, todayDate]);

  const dewormingSections = useMemo(
    () => projectDewormingTimelineSections(dewormingTimeline),
    [dewormingTimeline],
  );

  const dewormingNextStep = useMemo(() => {
    const nextDate = dewormingSections.nextStep?.date;
    if (!nextDate) return null;
    return (
      dewormingRecords.find(
        r =>
          (r.status === 'overdue' || r.status === 'missed' || r.status === 'upcoming') &&
          r.dueDate === nextDate,
      ) ??
      dewormingRecords.find(
        r => r.status === 'overdue' || r.status === 'missed' || r.status === 'upcoming',
      ) ??
      null
    );
  }, [dewormingRecords, dewormingSections.nextStep?.date]);

  const dewormingUpcoming = useMemo(() => {
    const upcomingByDate = new Set(dewormingSections.comingUp.map(item => item.date));
    return dewormingRecords
      .filter(r => r.status === 'upcoming' && upcomingByDate.has(r.dueDate))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [dewormingRecords, dewormingSections.comingUp]);

  const dewormingCompleted = useMemo(
    () => dewormingRecords.filter(r => r.status === 'completed'),
    [dewormingRecords],
  );

  const vaccinationPrimaryTask = useMemo(
    () => getNextVaccinationTask(),
    [getNextVaccinationTask, records],
  );
  const vaccinationUpcomingItems = useMemo(
    () => getUpcomingVaccinations(5),
    [getUpcomingVaccinations, records],
  );

  const displayPrimaryTask = isDewormingCategory
    ? dewormingNextStep
    : vaccinationPrimaryTask;
  const displayUpcomingItems = isDewormingCategory
    ? dewormingUpcoming
        .filter(item => item.id !== dewormingNextStep?.id)
        .slice(0, 5)
    : vaccinationUpcomingItems;
  const displayCompletedRecords = isDewormingCategory
    ? dewormingSections.history
        .map(item =>
          dewormingRecords.find(r => {
            const recordDate = (r.completedDate ?? r.dueDate).slice(0, 10);
            if (item.status === 'COMPLETED') {
              return r.status === 'completed' && recordDate === item.date;
            }
            if (item.status === 'SKIPPED') {
              return r.status === 'skipped' && recordDate === item.date;
            }
            return false;
          }),
        )
        .filter((record): record is SmartHealthRecord => Boolean(record))
    : vaccinationRecords.filter(r => r.status === 'completed');

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

  const canShowDewormingAdjustActions = useMemo(() => {
    if (!isDewormingCategory || !displayPrimaryTask || !todayDate) return false;
    if (
      displayPrimaryTask.status === 'overdue' ||
      displayPrimaryTask.status === 'missed'
    ) {
      return true;
    }
    const due = new Date(`${displayPrimaryTask.dueDate}T00:00:00`);
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

  const nextDewormingFallbackDate = useMemo((): string | null => {
    if (!isDewormingCategory) return null;
    if (dewormingNextStep || dewormingUpcoming.length > 0) return null;
    const latestCompleted = dewormingCompleted
      .slice()
      .sort((a, b) =>
        (b.completedDate ?? b.dueDate).localeCompare(a.completedDate ?? a.dueDate),
      )[0];
    if (!latestCompleted) return null;
    return addMonthsToIsoDate(latestCompleted.dueDate, 3);
  }, [
    isDewormingCategory,
    dewormingNextStep,
    dewormingUpcoming.length,
    dewormingCompleted,
  ]);

  const nextVaccinationProjectionDate = useMemo((): string | null => {
    if (isDewormingCategory) return null;
    if (vaccinationPrimaryTask || vaccinationUpcomingItems.length > 0) return null;
    const nextPlanned = vaccinationRecords.find(
      record => record.status === 'upcoming' || record.status === 'locked',
    );
    return nextPlanned?.dueDate ?? null;
  }, [
    isDewormingCategory,
    vaccinationPrimaryTask,
    vaccinationUpcomingItems.length,
    vaccinationRecords,
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

  React.useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 1600);
    return () => clearTimeout(timer);
  }, [successMessage]);

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

  const handleConfirmSkipDose = (): void => {
    if (!displayPrimaryTask || !activePet?.id) return;
    const reason = skipReasonInput.trim();
    if (reason.length < 2) {
      setSkipError('Please enter a short reason.');
      return;
    }
    setSkipError(null);
    void useSmartHealthRecordStore
      .getState()
      .skipDewormingDose(displayPrimaryTask.id, reason, activePet.dob)
      .then(() => {
        setShowSkipModal(false);
        setSkipReasonInput('');
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
                ? `${petAgeWeeks} weeks old`
                : 'Age not set'}
            </AppText>
          </View>

          <View style={styles.headerRightSpacer} />
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

            {!displayPrimaryTask &&
            !nextDewormingFallbackDate &&
            !nextVaccinationProjectionDate ? (
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
                  No urgent items - you are caught up for this tab.
                </AppText>
              </View>
            ) : null}

            {displayPrimaryTask && !isDewormingCategory ? (
              <SmartHealthRecordItem
                record={displayPrimaryTask as SmartHealthRecord}
                variant="hero"
                primaryActionLabel={logPrimaryCtaLabel}
                onMarkDone={handleMarkVaccinationDone}
                onEditDate={() => openUpdateDate(displayPrimaryTask)}
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
                        : displayPrimaryTask.dueDate === todayDate
                        ? colors.accent
                        : colors.borderSubtle,
                    borderWidth:
                      displayPrimaryTask.dueDate === todayDate ? 2 : 1,
                    borderRadius: radius.lg,
                    padding: space('md'),
                  },
                ]}
              >
                <AppText
                  style={[textStyles.title, { color: colors.text.heading }]}
                >
                  Deworming{' '}
                  {displayPrimaryTask.status === 'missed'
                    ? 'Overdue'
                    : displayPrimaryTask.status === 'overdue'
                    ? 'Overdue'
                    : displayPrimaryTask.dueDate === todayDate
                    ? 'Due today'
                    : 'Due'}
                </AppText>
                <AppText
                  style={[textStyles.body, { color: colors.text.secondary }]}
                >
                  {formatUiDate(displayPrimaryTask.dueDate)}
                  {displayPrimaryTask.cadence &&
                    ` · ${cadenceDisplayLabel(displayPrimaryTask.cadence)}`}
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
                {canShowDewormingAdjustActions ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: space('sm'),
                      marginTop: space('sm'),
                      justifyContent: 'flex-start',
                    }}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Reschedule deworming"
                      onPress={() => openUpdateDate(displayPrimaryTask)}
                      style={[
                        styles.addBtn,
                        {
                          minWidth: 120,
                          backgroundColor: colors.surfaceAlt,
                          borderRadius: radius.round,
                          borderWidth: 1,
                          borderColor: colors.borderSubtle,
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
                        Reschedule
                      </AppText>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Skip this deworming dose"
                      onPress={() => {
                        setSkipReasonInput('');
                        setSkipError(null);
                        setShowSkipModal(true);
                      }}
                      style={[
                        styles.addBtn,
                        {
                          minWidth: 120,
                          backgroundColor: colors.surfaceAlt,
                          borderRadius: radius.round,
                          borderWidth: 1,
                          borderColor: colors.borderSubtle,
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
                        Skip dose
                      </AppText>
                    </Pressable>
                  </View>
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
                        {item.cadence &&
                          ` · ${cadenceDisplayLabel(item.cadence)}`}
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
              ) : nextVaccinationProjectionDate ? (
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
                    Vaccinations are up-to-date. Next projected vaccine:{' '}
                    {formatUiDate(nextVaccinationProjectionDate)}
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
                              {item.status === 'skipped'
                                ? 'Deworming skipped'
                                : item.status === 'missed'
                                ? 'Deworming missed'
                                : 'Deworming completed'}
                            </AppText>
                            <AppText
                              style={[
                                textStyles.caption,
                                { color: colors.text.secondary },
                              ]}
                            >
                              {formatUiDate(item.dueDate)}
                              {item.status === 'completed' && item.completedDate
                                ? ` · logged ${formatUiDate(item.completedDate)}`
                                : ''}
                              {item.skipReason
                                ? ` · ${item.skipReason}`
                                : ''}
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

            <View style={{ marginTop: space('2xl') }}>
              <PremiumUpgradeCard />
            </View>
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
                minimumDate={
                  editingRecord?.type === 'deworming'
                    ? new Date(`${todayDate}T00:00:00`)
                    : undefined
                }
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

      {isDewormingCategory ? (
        <Modal
          transparent
          visible={showSkipModal}
          animationType="fade"
          onRequestClose={() => setShowSkipModal(false)}
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
                Skip dose
              </AppText>
              <AppText
                style={[
                  textStyles.caption,
                  { color: colors.text.secondary, marginTop: space('xs') },
                ]}
              >
                Tell us why so we can adjust the schedule. This is saved to your
                history.
              </AppText>
              <TextInput
                accessibilityLabel="Skip reason"
                value={skipReasonInput}
                onChangeText={text => {
                  setSkipReasonInput(text);
                  setSkipError(null);
                }}
                placeholder="e.g. No product at home"
                placeholderTextColor={colors.text.subdued}
                style={{
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  borderRadius: radius.md,
                  padding: space('sm'),
                  marginTop: space('sm'),
                  color: colors.text.body,
                  fontFamily: fontFamilies.medium,
                }}
                multiline
              />
              {skipError ? (
                <AppText
                  style={[
                    textStyles.caption,
                    { color: colors.danger, marginTop: space('sm') },
                  ]}
                >
                  {skipError}
                </AppText>
              ) : null}
              <View style={[styles.modalActions, { marginTop: space('md') }]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowSkipModal(false)}
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
                      { color: colors.text.secondary },
                    ]}
                  >
                    Cancel
                  </AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleConfirmSkipDose}
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
                      { color: colors.text.inverse },
                    ]}
                  >
                    Confirm skip
                  </AppText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}

      {isDewormingCategory && (
        <Modal
          transparent
          visible={showDewormingModal}
          animationType="fade"
          onRequestClose={closeDewormingModal}
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
                  onPress={closeDewormingModal}
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

      {!isDewormingCategory ? (
        <Modal
          transparent
          visible={showVaccinationModal}
          animationType="fade"
          onRequestClose={closeVaccinationModal}
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
                Log Vaccination
              </AppText>
              <AppText
                style={[
                  textStyles.caption,
                  { color: colors.text.secondary, marginTop: space('xs') },
                ]}
              >
                Select the date this vaccine was administered.
              </AppText>

              <View style={{ marginTop: space('lg') }}>
                <DatePickerField
                  value={selectedVaccinationDate}
                  onChange={setSelectedVaccinationDate}
                  maximumDate={new Date()}
                />
              </View>

              {vaccinationLogError ? (
                <AppText
                  style={[
                    textStyles.caption,
                    { color: colors.danger, marginTop: space('sm') },
                  ]}
                >
                  {vaccinationLogError}
                </AppText>
              ) : null}

              <View style={[styles.modalActions, { marginTop: space('md') }]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={closeVaccinationModal}
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
                  onPress={handleSaveVaccinationDate}
                  style={[
                    styles.modalActionBtn,
                    { borderRadius: radius.md, backgroundColor: colors.accent },
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
      ) : null}

      <Modal
        transparent
        visible={Boolean(successMessage)}
        animationType="fade"
        onRequestClose={() => setSuccessMessage(null)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.success,
                borderRadius: radius.lg,
                padding: space('md'),
              },
            ]}
          >
            <AppText
              style={[
                textStyles.subtitle,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
            >
              Success
            </AppText>
            <AppText
              style={[
                textStyles.caption,
                { color: colors.text.secondary, marginTop: space('xs') },
              ]}
            >
              {successMessage}
            </AppText>
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
  headerRightSpacer: {
    width: 40,
    height: 40,
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
