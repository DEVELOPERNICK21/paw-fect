import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTabBarInset } from '../../../../app/navigation/layout';
import type {
  HealthRecordsRootNavigation,
  HealthStackParamList,
} from '../../../../app/navigation/types';
import { AppText } from '../../../../shared/components/AppText';
import { DatePickerField } from '../../../../shared/components/DatePickerField';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { getTodayIsoDateLocal } from '../../../../shared/utils/calendarDate';
import { resolvePetAvatarSource } from '../../../../shared/utils/petDisplayPhoto';
import { icons } from '../../../../shared/assets/icons';
import { formatPetAgeLabel } from '../../../pets/domain/utils/petDobDisplay';
import { usePetStore } from '../../../pets/store/petStore';
import { useSmartHealthRecordStore } from '../../store/smartHealthRecordStore';
import { smartHealthSelectors } from '../../store/smartHealthSelectors';
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
import { healthStatusHeadline } from '../../domain/utils/careOwnerCopy';
import { HealthFullPlanSection } from '../components/HealthFullPlanSection';
import { HealthHeroBar } from '../components/HealthHeroBar';
import { NeedsNextCareCard } from '../components/NeedsNextCareCard';
import { PremiumUpgradeCard } from '../components/PremiumUpgradeCard';
import { WhySeeingThisSection } from '../components/WhySeeingThisSection';
import { projectDewormingFromSmartRecords } from '../utils/projectDewormingFromSmartRecords';

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatWhenLine(isoDate: string, status: SmartHealthRecord['status']): string {
  if (status === 'completed') {
    return 'Done';
  }
  const due = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return isoDate;
  const today = startOfLocalDay(new Date());
  const dueDay = startOfLocalDay(due);
  const diffDays = Math.round(
    (dueDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (status === 'overdue' || status === 'missed' || diffDays < 0) {
    const late = Math.abs(diffDays);
    if (late === 0) return 'Due today';
    if (late === 1) return '1 day overdue';
    return `${late} days overdue`;
  }
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 14) return `In ${diffDays} days`;
  return 'Upcoming';
}

function statusChipLabel(status: SmartHealthRecord['status']): string {
  if (status === 'overdue' || status === 'missed') return 'Needs attention';
  return 'Upcoming';
}

function canMarkRecord(
  record: SmartHealthRecord,
  todayDate: string,
): boolean {
  if (record.status === 'overdue' || record.status === 'missed') {
    return true;
  }
  if (record.type === 'deworming') {
    const due = new Date(`${record.dueDate}T00:00:00`);
    const todayd = new Date(`${todayDate}T00:00:00`);
    const diffDays = Math.floor(
      (todayd.getTime() - due.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays >= -3;
  }
  return todayDate >= record.dueDate;
}

function canAdjustDeworm(
  record: SmartHealthRecord,
  todayDate: string,
): boolean {
  if (record.type !== 'deworming') return false;
  if (record.status === 'overdue' || record.status === 'missed') return true;
  const due = new Date(`${record.dueDate}T00:00:00`);
  const todayd = new Date(`${todayDate}T00:00:00`);
  const diffDays = Math.floor(
    (todayd.getTime() - due.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diffDays >= -3;
}

export const HealthRecordScreen: React.FC = () => {
  const navigation = useNavigation<HealthRecordsRootNavigation>();
  const route = useRoute<RouteProp<HealthStackParamList, 'HealthRecords'>>();
  const focusRecordId = route.params?.focusRecordId;
  const focusPetId = route.params?.petId;
  const theme = useTheme();
  const tabBarInset = useAppTabBarInset();
  const { colors, space, radius, textStyles, fontFamilies, spacing } = theme;

  const activePet = usePetStore(s => s.activePet);
  const records = useSmartHealthRecordStore(s => s.records);
  const loading = useSmartHealthRecordStore(s => s.loading);
  const error = useSmartHealthRecordStore(s => s.error);
  const markAsDone = useSmartHealthRecordStore.getState().markAsDone;
  const reschedule = useSmartHealthRecordStore(s => s.reschedule);

  const [actionRecord, setActionRecord] = useState<SmartHealthRecord | null>(
    null,
  );
  const [editingRecord, setEditingRecord] = useState<SmartHealthRecord | null>(
    null,
  );
  const [editingDueDate, setEditingDueDate] = useState('');
  const [editDueDateError, setEditDueDateError] = useState<string | null>(null);

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
  const [focusUnavailableDismissed, setFocusUnavailableDismissed] =
    useState(false);

  const todayDate = getTodayIsoDateLocal();

  React.useEffect(() => {
    setFocusUnavailableDismissed(false);
  }, [focusRecordId, focusPetId]);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      const loadRecordsForFocus = async (): Promise<void> => {
        if (focusPetId != null && focusPetId !== activePet?.id) {
          await usePetStore.getState().setActivePet(focusPetId);
        }
        const petIdToLoad =
          focusPetId ?? usePetStore.getState().activePet?.id ?? null;
        if (cancelled || petIdToLoad == null) {
          return;
        }
        await useSmartHealthRecordStore.getState().loadPetRecords(petIdToLoad);
      };
      void loadRecordsForFocus();
      return () => {
        cancelled = true;
      };
    }, [focusPetId, activePet?.id]),
  );

  const focusedRecord = useMemo(() => {
    if (focusRecordId == null) return null;
    return records.find(record => record.id === focusRecordId) ?? null;
  }, [focusRecordId, records]);

  const showFocusUnavailableBanner =
    focusRecordId != null &&
    !loading &&
    focusedRecord == null &&
    !focusUnavailableDismissed;

  const needsNext = useMemo(
    () => smartHealthSelectors.getActionRequiredItems(records, 2),
    [records],
  );

  const planUpcoming = useMemo(
    () =>
      smartHealthSelectors.getUpcomingItems(records, {
        limit: 12,
        dedupeByFamily: false,
      }),
    [records],
  );

  const overdueCount = useMemo(
    () =>
      records.filter(r => r.status === 'overdue' || r.status === 'missed')
        .length,
    [records],
  );

  const statusLine = healthStatusHeadline({
    overdueCount,
    needsNextCount: needsNext.length,
  });

  const ageLabel = useMemo(
    () => formatPetAgeLabel(activePet?.dob),
    [activePet?.dob],
  );

  const dewormingRecords = useMemo(
    () => records.filter(r => r.type === 'deworming'),
    [records],
  );
  const dewormingProjection = useMemo(
    () => projectDewormingFromSmartRecords(dewormingRecords),
    [dewormingRecords],
  );

  const handleSaveDewormingDate = async (): Promise<void> => {
    if (!selectedDewormingDate || !activePet?.dob || !actionRecord) return;

    const cadence = actionRecord.cadence;
    const lastCompletionDate = getLastCompletedDewormingIsoDate(
      records,
      actionRecord.id,
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
      actionRecord.dueDate,
    );

    if (!check.ok) {
      setDewormingLogError(check.error);
      return;
    }

    setDewormingLogError(null);

    const proceed = async (): Promise<void> => {
      await markAsDone(actionRecord.id, selectedDewormingDate, activePet.dob);
      setShowDewormingModal(false);
      setActionRecord(null);
      setSuccessMessage('Saved — great job caring for your pet.');
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

  const handleSaveVaccinationDate = async (): Promise<void> => {
    if (!actionRecord || !selectedVaccinationDate) return;
    if (!activePet?.dob) {
      setVaccinationLogError('Pet date of birth is required to log a vaccine.');
      return;
    }
    const prereq = resolvePrerequisiteCompletedDate(
      records,
      actionRecord.dependsOn,
    );
    if (actionRecord.dependsOn && !prereq) {
      setVaccinationLogError(
        'Complete the previous dose in this series first.',
      );
      return;
    }
    const vaxCheck = validateVaccinationLogDate({
      petDateOfBirth: activePet.dob.slice(0, 10),
      today: todayDate,
      selectedDate: selectedVaccinationDate,
      dueDate: actionRecord.dueDate,
      prerequisiteCompletedDate: prereq,
      isAnnualBooster: actionRecord.recurrenceType === 'yearly',
    });
    if (!vaxCheck.ok) {
      setVaccinationLogError(vaxCheck.error);
      return;
    }
    setVaccinationLogError(null);

    const proceed = async (): Promise<void> => {
      await markAsDone(
        actionRecord.id,
        selectedVaccinationDate,
        activePet?.dob,
      );
      setShowVaccinationModal(false);
      setActionRecord(null);
      setSuccessMessage('Saved — great job caring for your pet.');
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
    setActionRecord(null);
  };

  const closeDewormingModal = (): void => {
    setShowDewormingModal(false);
    setSelectedDewormingDate('');
    setDewormingLogError(null);
    setActionRecord(null);
  };

  const handleMarkDone = useCallback(
    (record: SmartHealthRecord): void => {
      setActionRecord(record);
      if (record.type === 'deworming') {
        if (!activePet?.dob || !todayDate) return;
        setDewormingLogError(null);
        setSelectedDewormingDate(todayDate);
        setShowDewormingModal(true);
        return;
      }
      if (!todayDate) return;
      setVaccinationLogError(null);
      setSelectedVaccinationDate(todayDate);
      setShowVaccinationModal(true);
    },
    [activePet?.dob, todayDate],
  );

  const openUpdateDate = useCallback((record: SmartHealthRecord): void => {
    setEditingRecord(record);
    setEditingDueDate(record.dueDate);
    setEditDueDateError(null);
  }, []);

  const handleOpenSkipModal = useCallback((record: SmartHealthRecord): void => {
    setActionRecord(record);
    setSkipReasonInput('');
    setSkipError(null);
    setShowSkipModal(true);
  }, []);

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
        "Due date cannot be before your pet's date of birth.",
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
    if (!actionRecord || !activePet?.id) return;
    const reason = skipReasonInput.trim();
    if (reason.length < 2) {
      setSkipError('Please enter a short reason.');
      return;
    }
    setSkipError(null);
    void useSmartHealthRecordStore
      .getState()
      .skipDewormingDose(actionRecord.id, reason, activePet.dob)
      .then(() => {
        setShowSkipModal(false);
        setSkipReasonInput('');
        setActionRecord(null);
      });
  };

  React.useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 1600);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const dewormingLogPickerMinimum = useMemo((): Date | undefined => {
    if (!activePet?.dob || !actionRecord || actionRecord.type !== 'deworming') {
      return undefined;
    }
    const c = (actionRecord.cadence ?? 'every_3_months') as
      | 'every_14_days'
      | 'monthly'
      | 'every_2_months'
      | 'every_3_months';
    const iso = getMinimumLogDate(activePet.dob.slice(0, 10), todayDate, c);
    return new Date(`${iso}T12:00:00`);
  }, [activePet?.dob, actionRecord, todayDate]);

  const vaccinationLogPickerMinimum = useMemo((): Date | undefined => {
    if (!activePet?.dob || !actionRecord || actionRecord.type !== 'vaccination') {
      return undefined;
    }
    const d0 = activePet.dob.slice(0, 10);
    const due = actionRecord.dueDate.slice(0, 10);
    const floor = d0 > due ? d0 : due;
    return new Date(`${floor}T12:00:00`);
  }, [activePet?.dob, actionRecord]);

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

  const onTrackEmpty =
    needsNext.length === 0 &&
    !dewormingProjection.primary &&
    planUpcoming.length === 0;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}
    >
      <HealthHeroBar
        petName={activePet.name}
        petPhoto={resolvePetAvatarSource(activePet)}
        ageLabel={ageLabel === 'Not set' ? 'Age not set' : ageLabel}
        onPressBack={() => navigation.goBack()}
        theme={theme}
      />

      <View style={[styles.body, { backgroundColor: colors.backgroundAlt }]}>
        {showFocusUnavailableBanner ? (
          <View
            style={[
              styles.focusUnavailableBanner,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.borderSubtle,
                borderRadius: radius.md,
                marginHorizontal: spacing.lg,
                marginBottom: spacing.sm,
                padding: spacing.sm,
              },
            ]}
          >
            <AppText
              style={[
                textStyles.caption,
                {
                  color: colors.text.secondary,
                  flex: 1,
                  fontFamily: fontFamilies.medium,
                },
              ]}
            >
              This health task is no longer available.
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
              onPress={() => setFocusUnavailableDismissed(true)}
              hitSlop={8}
            >
              <MaterialIcon
                name="close"
                size={18}
                color={colors.text.subdued}
              />
            </Pressable>
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: tabBarInset + spacing['2xl'],
            gap: spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          <AppText
            style={[
              textStyles.body,
              {
                color:
                  overdueCount > 0 ? colors.danger : colors.primaryDark,
                fontFamily: fontFamilies.semibold,
              },
            ]}
          >
            {statusLine}
            {overdueCount === 0 ? ' ❤️' : ''}
          </AppText>

          <View style={{ gap: spacing.sm }}>
            <AppText
              style={[
                textStyles.subtitle,
                {
                  color: colors.text.heading,
                  fontFamily: fontFamilies.bold,
                },
              ]}
            >
              What {activePet.name} needs next
            </AppText>

            {needsNext.length > 0 ? (
              needsNext.map(record => (
                <NeedsNextCareCard
                  key={record.id}
                  record={record}
                  petName={activePet.name}
                  whenLine={formatWhenLine(record.dueDate, record.status)}
                  statusLabel={statusChipLabel(record.status)}
                  primaryActionLabel={
                    canMarkRecord(record, todayDate) ? 'I did this' : undefined
                  }
                  onMarkDone={
                    canMarkRecord(record, todayDate)
                      ? handleMarkDone
                      : undefined
                  }
                  onEditDate={
                    record.type === 'deworming'
                      ? canAdjustDeworm(record, todayDate)
                        ? openUpdateDate
                        : undefined
                      : openUpdateDate
                  }
                  onSkipDose={
                    canAdjustDeworm(record, todayDate)
                      ? handleOpenSkipModal
                      : undefined
                  }
                />
              ))
            ) : (
              <View
                style={[
                  styles.emptyActionHint,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                    borderRadius: radius.xl,
                    padding: spacing.md,
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
                  {onTrackEmpty
                    ? `You're on track — ${activePet.name} looks covered for now.`
                    : `Nothing urgent right now for ${activePet.name}.`}
                </AppText>
                <AppText
                  style={[
                    textStyles.caption,
                    {
                      color: colors.text.secondary,
                      marginTop: spacing.xs,
                    },
                  ]}
                >
                  Open the full plan below anytime.
                </AppText>
              </View>
            )}
          </View>

          <WhySeeingThisSection
            petName={activePet.name}
            ageLabel={
              ageLabel === 'Not set' ? 'still growing' : ageLabel.toLowerCase()
            }
          />

          <HealthFullPlanSection records={records} />

          {error ? (
            <AppText
              style={[
                textStyles.caption,
                { color: colors.text.secondary },
              ]}
            >
              {error}
            </AppText>
          ) : null}

          <AppText
            style={[
              textStyles.caption,
              {
                color: colors.text.subdued,
                fontFamily: fontFamilies.medium,
                textAlign: 'center',
              },
            ]}
          >
            These are reminders to help you remember. Your vet decides what is
            right for your pet.
          </AppText>

          <PremiumUpgradeCard />
        </ScrollView>

        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}
      </View>

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
              Change date
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
                onPress={applyDateUpdate}
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
              Skip for now
            </AppText>
            <AppText
              style={[
                textStyles.caption,
                { color: colors.text.secondary, marginTop: space('xs') },
              ]}
            >
              Tell us why in a few words. We will move the next worm medicine
              day.
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
                  { borderRadius: radius.md, backgroundColor: colors.accent },
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
                borderRadius: radius.lg,
                padding: space('lg'),
              },
            ]}
          >
            <AppText
              style={[textStyles.subtitle, { color: colors.text.heading }]}
            >
              When did you give worm medicine?
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
                onPress={() => {
                  void handleSaveDewormingDate();
                }}
                style={[
                  styles.modalActionBtn,
                  { borderRadius: radius.md, backgroundColor: colors.accent },
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
              When was this vaccine given?
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
                onPress={() => {
                  void handleSaveVaccinationDate();
                }}
                style={[
                  styles.modalActionBtn,
                  { borderRadius: radius.md, backgroundColor: colors.accent },
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

      <Modal
        transparent
        visible={Boolean(successMessage)}
        animationType="fade"
        onRequestClose={() => setSuccessMessage(null)}
      >
        <View
          style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
        >
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
  safeArea: { flex: 1 },
  body: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyActionHint: { borderWidth: 1 },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
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
  modalCard: { borderWidth: 1 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 44,
  },
  focusUnavailableBanner: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default HealthRecordScreen;
