import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SectionList,
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
import {
  getMinimumLogDate,
  validateLogDateForCadence,
} from '../../domain/utils/DewormingEngine';
import {
  resolvePrerequisiteCompletedDate,
  validateVaccinationLogDate,
} from '../../domain/utils/vaccinationLogValidation';
import { getLastCompletedDewormingIsoDate } from '../../domain/utils/smartHealthDewormingInference';
import { nextDateFromCadence } from '../../domain/utils/PetCareLifecycleEngine';
import { PremiumUpgradeCard } from '../components/PremiumUpgradeCard';
import { SmartHealthRecordItem } from '../components/SmartHealthRecordItem';
import { weeksBetweenDobAndToday } from '../utils/healthRecordScreenPartition';
import { projectDewormingFromSmartRecords } from '../utils/projectDewormingFromSmartRecords';

type CategoryFilter = 'Vaccination' | 'Deworming';

type HealthRecordListSection = {
  key: 'upcoming' | 'history';
  title: string;
  data: SmartHealthRecord[];
};

const CATEGORIES: CategoryFilter[] = ['Vaccination', 'Deworming'];

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
  const [editDueDateError, setEditDueDateError] = useState<string | null>(null);
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


  const handleSaveDewormingDate = async () => {
    if (!selectedDewormingDate || !activePet?.dob || !displayPrimaryTask)
      return;

    const cadence = displayPrimaryTask.cadence;
    const lastCompletionDate = getLastCompletedDewormingIsoDate(
      records,
      displayPrimaryTask.id,
    );

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
      displayPrimaryTask.dueDate,
    );

    if (!check.ok) {
      setDewormingLogError(check.error);
      return;
    }

    setDewormingLogError(null);

    const proceed = async () => {
      await markAsDone(
        displayPrimaryTask.id,
        selectedDewormingDate,
        activePet.dob,
      );
      setShowDewormingModal(false);
      setSuccessMessage('Deworming log saved successfully.');
    };

    if (check.warning) {
      Alert.alert('Logging slightly late', check.warning, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log anyway', style: 'default', onPress: () => void proceed() },
      ]);
      return;
    }

    await proceed();
  };

  const isDewormingCategory = selectedCategory === 'Deworming';


  const handleSaveVaccinationDate = async () => {
    if (!displayPrimaryTask || !selectedVaccinationDate) return;
    if (!activePet?.dob) {
      setVaccinationLogError('Pet date of birth is required to log a vaccine.');
      return;
    }
    const prereq = resolvePrerequisiteCompletedDate(
      records,
      displayPrimaryTask.dependsOn,
    );
    if (displayPrimaryTask.dependsOn && !prereq) {
      setVaccinationLogError(
        'Complete the previous dose in this series first.',
      );
      return;
    }
    const vaxCheck = validateVaccinationLogDate({
      petDateOfBirth: activePet.dob.slice(0, 10),
      today: todayDate,
      selectedDate: selectedVaccinationDate,
      dueDate: displayPrimaryTask.dueDate,
      prerequisiteCompletedDate: prereq,
      isAnnualBooster: displayPrimaryTask.recurrenceType === 'yearly',
    });
    if (!vaxCheck.ok) {
      setVaccinationLogError(vaxCheck.error);
      return;
    }
    setVaccinationLogError(null);

    const proceed = async () => {
      await markAsDone(
        displayPrimaryTask.id,
        selectedVaccinationDate,
        activePet?.dob,
      );
      setShowVaccinationModal(false);
      setSuccessMessage('Vaccination log saved successfully.');
    };

    if (vaxCheck.warning) {
      Alert.alert('Confirm vaccination log', vaxCheck.warning, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log anyway', style: 'default', onPress: () => void proceed() },
      ]);
      return;
    }

    await proceed();
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

  const dewormingProjection = useMemo(
    () => projectDewormingFromSmartRecords(dewormingRecords),
    [dewormingRecords],
  );
  const dewormingNextStep = dewormingProjection.primary;
  const dewormingUpcoming = dewormingProjection.upcoming;

  const dewormingCompleted = useMemo(
    () => dewormingRecords.filter(r => r.status === 'completed'),
    [dewormingRecords],
  );

  const vaccinationPrimaryTask = useMemo(() => {
    // Reference records to ensure memo re-runs when state changes
    if (records) return getNextVaccinationTask();
    return null;
  }, [getNextVaccinationTask, records]);

  const vaccinationUpcomingItems = useMemo(() => {
    // Reference records to ensure memo re-runs when state changes
    if (records) return getUpcomingVaccinations(5);
    return [];
  }, [getUpcomingVaccinations, records]);

  const displayPrimaryTask = useMemo(
    () => (isDewormingCategory ? dewormingNextStep : vaccinationPrimaryTask),
    [isDewormingCategory, dewormingNextStep, vaccinationPrimaryTask],
  );

  const displayUpcomingItems = useMemo(
    () =>
      isDewormingCategory
        ? dewormingUpcoming.slice(0, 5)
        : vaccinationUpcomingItems,
    [isDewormingCategory, dewormingUpcoming, vaccinationUpcomingItems],
  );

  const displayCompletedRecords = useMemo(
    () =>
      isDewormingCategory
        ? dewormingProjection.history
        : vaccinationRecords.filter(r => r.status === 'completed'),
    [isDewormingCategory, dewormingProjection.history, vaccinationRecords],
  );

  const handleMarkDewormingDone = React.useCallback((record: SmartHealthRecord) => {
    if (!record || !activePet?.dob || !todayDate) return;

    setDewormingLogError(null);
    setSelectedDewormingDate(todayDate);
    setShowDewormingModal(true);
  }, [activePet?.dob, todayDate]);

  const handleMarkVaccinationDone = React.useCallback((record: SmartHealthRecord) => {
    if (!record || !todayDate) return;
    setVaccinationLogError(null);
    setSelectedVaccinationDate(todayDate);
    setShowVaccinationModal(true);
  }, [todayDate]);

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

  const canMarkVaccinationDone = useMemo(() => {
    if (isDewormingCategory || !displayPrimaryTask || !todayDate) return false;
    if (displayPrimaryTask.status === 'overdue' || displayPrimaryTask.status === 'missed') {
      return true;
    }
    return todayDate >= displayPrimaryTask.dueDate;
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

  const dewormingLogPickerMinimum = useMemo((): Date | undefined => {
    if (
      !isDewormingCategory ||
      !activePet?.dob ||
      !displayPrimaryTask ||
      !todayDate
    ) {
      return undefined;
    }
    const c = (displayPrimaryTask.cadence ?? 'every_3_months') as
      | 'every_14_days'
      | 'monthly'
      | 'every_2_months'
      | 'every_3_months';
    const iso = getMinimumLogDate(
      activePet.dob.slice(0, 10),
      todayDate,
      c,
    );
    return new Date(`${iso}T12:00:00`);
  }, [isDewormingCategory, activePet?.dob, displayPrimaryTask, todayDate]);

  const vaccinationLogPickerMinimum = useMemo((): Date | undefined => {
    if (isDewormingCategory || !activePet?.dob || !displayPrimaryTask) {
      return undefined;
    }
    const d0 = activePet.dob.slice(0, 10);
    const due = displayPrimaryTask.dueDate.slice(0, 10);
    const floor = d0 > due ? d0 : due;
    return new Date(`${floor}T12:00:00`);
  }, [isDewormingCategory, activePet?.dob, displayPrimaryTask]);

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
    const anchor = (
      latestCompleted.completedDate ?? latestCompleted.dueDate
    ).slice(0, 10);
    return nextDateFromCadence(
      anchor,
      latestCompleted.cadence ?? 'every_3_months',
    );
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

  const minimumEditDueDate = useMemo(() => {
    if (!editingRecord || !todayDate) {
      return undefined;
    }
    const todayMs = new Date(`${todayDate}T12:00:00`).getTime();
    const dobMs = activePet?.dob
      ? new Date(`${activePet.dob.slice(0, 10)}T12:00:00`).getTime()
      : Number.NEGATIVE_INFINITY;
    if (editingRecord.type === 'deworming') {
      return new Date(Math.max(todayMs, dobMs));
    }
    if (activePet?.dob) {
      return new Date(`${activePet.dob.slice(0, 10)}T12:00:00`);
    }
    return undefined;
  }, [editingRecord, todayDate, activePet?.dob]);

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

  const logPrimaryCtaLabel =
    selectedCategory === 'Vaccination' ? 'Log Vaccination' : 'Log Deworming';

  const listSections = useMemo((): HealthRecordListSection[] => {
    const sections: HealthRecordListSection[] = [
      {
        key: 'upcoming',
        title: 'COMING UP',
        data: displayUpcomingItems as SmartHealthRecord[],
      },
    ];
    if (isCompletedExpanded) {
      sections.push({
        key: 'history',
        title: `HISTORY (${displayCompletedRecords.length})`,
        data: displayCompletedRecords as SmartHealthRecord[],
      });
    }
    return sections;
  }, [
    displayUpcomingItems,
    displayCompletedRecords,
    isCompletedExpanded,
  ]);

  const openUpdateDate = React.useCallback((record: SmartHealthRecord): void => {
    setEditingRecord(record);
    setEditingDueDate(record.dueDate);
    setEditDueDateError(null);
  }, []);

  const handleOpenSkipModal = React.useCallback((record: SmartHealthRecord) => {
    if (!record) return;
    setSkipReasonInput('');
    setSkipError(null);
    setShowSkipModal(true);
  }, []);

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

  const closeUpdateDate = (): void => {
    setEditingRecord(null);
    setEditingDueDate('');
    setEditDueDateError(null);
  };

  const applyDateUpdate = (): void => {
    if (!editingRecord || !editingDueDate) return;
    const iso = editingDueDate.slice(0, 10);
    if (activePet?.dob && iso < activePet.dob.slice(0, 10)) {
      setEditDueDateError(
        'Due date cannot be before your pet\'s date of birth.',
      );
      return;
    }
    setEditDueDateError(null);
    void reschedule(editingRecord.id, editingDueDate, activePet?.dob)
      .then(() => {
        closeUpdateDate();
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error && err.message.trim().length > 0
            ? err.message
            : 'Unable to reschedule.';
        setEditDueDateError(message);
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

      <SectionList
        sections={listSections}
        keyExtractor={item => item.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View>
            <View style={{ marginTop: space('md') }}>
              <AppText
                style={[textStyles.overline, { color: colors.text.subdued }]}
              >
                NEXT STEP
              </AppText>
            </View>

            <View style={{ marginTop: space('sm') }}>
              {displayPrimaryTask ? (
                !isDewormingCategory ? (
                  <SmartHealthRecordItem
                    record={displayPrimaryTask as SmartHealthRecord}
                    variant="hero"
                    primaryActionLabel={
                      canMarkVaccinationDone ? logPrimaryCtaLabel : undefined
                    }
                    onMarkDone={
                      canMarkVaccinationDone
                        ? handleMarkVaccinationDone
                        : undefined
                    }
                    onEditDate={openUpdateDate}
                  />
                ) : (
                  <SmartHealthRecordItem
                    record={displayPrimaryTask as SmartHealthRecord}
                    variant="hero"
                    primaryActionLabel={
                      canMarkDewormingDone ? logPrimaryCtaLabel : undefined
                    }
                    onMarkDone={
                      canMarkDewormingDone
                        ? handleMarkDewormingDone
                        : undefined
                    }
                    onEditDate={
                      canShowDewormingAdjustActions
                        ? openUpdateDate
                        : undefined
                    }
                    onSkipDose={
                      canShowDewormingAdjustActions
                        ? handleOpenSkipModal
                        : undefined
                    }
                  />
                )
              ) : isDewormingCategory && nextDewormingFallbackDate ? (
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
                      textStyles.body,
                      {
                        color: colors.text.heading,
                        fontFamily: fontFamilies.medium,
                      },
                    ]}
                  >
                    You&apos;re on track.
                  </AppText>
                  <AppText
                    style={[
                      textStyles.caption,
                      {
                        color: colors.text.secondary,
                        fontFamily: fontFamilies.medium,
                        marginTop: space('xs'),
                      },
                    ]}
                  >
                    Next dose is estimated around{' '}
                    {formatUiDate(nextDewormingFallbackDate)}.
                  </AppText>
                </View>
              ) : !isDewormingCategory && nextVaccinationProjectionDate ? (
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
                      textStyles.body,
                      {
                        color: colors.text.heading,
                        fontFamily: fontFamilies.medium,
                      },
                    ]}
                  >
                    Vaccinations look current.
                  </AppText>
                  <AppText
                    style={[
                      textStyles.caption,
                      {
                        color: colors.text.secondary,
                        fontFamily: fontFamilies.medium,
                        marginTop: space('xs'),
                      },
                    ]}
                  >
                    Next projected dose:{' '}
                    {formatUiDate(nextVaccinationProjectionDate)}.
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
                    No urgent items — you&apos;re caught up for this tab.
                  </AppText>
                </View>
              )}
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => {
          if (section.key === 'upcoming') {
            return (
              <View style={{ marginTop: space('lg') }}>
                <AppText
                  style={[textStyles.overline, { color: colors.text.subdued }]}
                >
                  {section.title}
                </AppText>
                <View style={{ height: space('sm') }} />
              </View>
            );
          }
          return (
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
                  Hide
                </AppText>
              </Pressable>
              <View style={{ height: space('sm') }} />
            </View>
          );
        }}
        renderItem={({ item, section }) => (
          <View style={{ marginBottom: space('sm') }}>
            <SmartHealthRecordItem
              record={item}
              onEditDate={
                section.key === 'history'
                  ? item.status === 'completed' || !isDewormingCategory
                    ? openUpdateDate
                    : undefined
                  : openUpdateDate
              }
            />
          </View>
        )}
        renderSectionFooter={({ section }) => {
          if (section.key === 'upcoming' && section.data.length === 0) {
            return (
              <AppText
                style={[
                  textStyles.caption,
                  {
                    color: colors.text.subdued,
                    fontFamily: fontFamilies.medium,
                    paddingVertical: space('xs'),
                  },
                ]}
              >
                No further scheduled doses.
              </AppText>
            );
          }
          if (section.key === 'history' && section.data.length === 0) {
            return (
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
            );
          }
          return null;
        }}
        ListFooterComponent={
          <View>
            {!isCompletedExpanded ? (
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
                    Show
                  </AppText>
                </Pressable>
              </View>
            ) : null}

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
        }
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
                onChange={v => {
                  setEditingDueDate(v);
                  setEditDueDateError(null);
                }}
                minimumDate={minimumEditDueDate}
              />
            </View>
            {editDueDateError ? (
              <AppText
                style={[
                  textStyles.caption,
                  { color: colors.danger, marginTop: space('sm') },
                ]}
              >
                {editDueDateError}
              </AppText>
            ) : null}
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
                  minimumDate={dewormingLogPickerMinimum}
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
                  minimumDate={vaccinationLogPickerMinimum}
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
