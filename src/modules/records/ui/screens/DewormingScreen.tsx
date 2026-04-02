import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAppTabBarInset } from '../../../../app/navigation/layout';
import { AppText } from '../../../../shared/components/AppText';
import { DatePickerField } from '../../../../shared/components/DatePickerField';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { usePetStore } from '../../../pets/store/petStore';
import { useDewormingStore } from '../../store/dewormingStore';
import {
  cadenceDisplayLabel,
  getCadenceForDueDate,
  getMinimumLogDate,
  validateLogDateForCadence,
  type DewormingCadenceKind,
  type DewormingMetadata,
  type DewormingSymptom,
  type ScheduleItem,
} from '../../domain/utils/DewormingEngine';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
  const { colors, space, textStyles } = useTheme();
  return (
    <View style={{ marginTop: space('lg') }}>
      <AppText style={[textStyles.overline, { color: colors.text.subdued }]}>
        {title}
      </AppText>
      <View style={{ height: space('sm') }} />
      {children}
    </View>
  );
};

interface NextStepCardProps {
  dueDate: string;
  status: 'completed' | 'pending' | 'missed';
  urgency: DewormingMetadata['urgency'];
  riskLevel: DewormingMetadata['riskLevel'];
  cadence?: DewormingCadenceKind;
  onUpdate: () => void;
}

const NextStepCard: React.FC<NextStepCardProps> = ({
  dueDate,
  status,
  urgency,
  riskLevel,
  cadence,
  onUpdate,
}) => {
  const { colors, space, textStyles, fontFamilies } = useTheme();

  const isUrgent = urgency === 'critical' || urgency === 'high';
  const isOverdue = status === 'missed';

  const statusColor = isOverdue
    ? colors.danger
    : isUrgent
    ? colors.warning
    : colors.accent;

  const formatDate = (iso: string): string => {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusLabel = isOverdue ? 'OVERDUE' : isUrgent ? 'DUE NOW' : 'UPCOMING';

  const riskColor =
    riskLevel === 'high'
      ? colors.danger
      : riskLevel === 'medium'
      ? colors.warning
      : colors.success;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: statusColor,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: statusColor }]}>
          <AppText
            style={[
              textStyles.caption,
              { color: colors.text.inverse, fontFamily: fontFamilies.bold },
            ]}
          >
            {statusLabel}
          </AppText>
        </View>
        <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
          <AppText
            style={[
              textStyles.caption,
              {
                color: colors.text.inverse,
                fontFamily: fontFamilies.bold,
                fontSize: 10,
              },
            ]}
          >
            {riskLevel.toUpperCase()} RISK
          </AppText>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <MaterialIcon name="medication" size={32} color={statusColor} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText
            style={[
              textStyles.subtitle,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
          >
            Deworming
          </AppText>
          <AppText
            style={[
              textStyles.body,
              { color: colors.text.secondary, marginTop: space('xs') },
            ]}
          >
            {isOverdue
              ? `Was due ${formatDate(dueDate)}`
              : `Due ${formatDate(dueDate)}`}
          </AppText>
          {cadence ? (
            <AppText
              style={[
                textStyles.caption,
                {
                  color: colors.text.subdued,
                  marginTop: space('xs'),
                  fontFamily: fontFamilies.medium,
                },
              ]}
            >
              {cadenceDisplayLabel(cadence)}
            </AppText>
          ) : null}
        </View>
      </View>

      <View style={styles.cardActions}>
        <Pressable
          style={[
            styles.actionBtn,
            {
              backgroundColor: statusColor,
              borderColor: statusColor,
            },
          ]}
          onPress={onUpdate}
        >
          <MaterialIcon name="edit" size={18} color={colors.text.inverse} />
          <AppText
            style={[
              textStyles.caption,
              {
                color: colors.text.inverse,
                marginLeft: space('xs'),
                fontFamily: fontFamilies.bold,
              },
            ]}
          >
            Update
          </AppText>
        </Pressable>
      </View>
    </View>
  );
};

interface UpcomingItemProps {
  dueDate: string;
  cadence?: DewormingCadenceKind;
}

const UpcomingItem: React.FC<UpcomingItemProps> = ({ dueDate, cadence }) => {
  const { colors, space, textStyles, fontFamilies } = useTheme();

  const formatDate = (iso: string): string => {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View
      style={[
        styles.upcomingItem,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
          borderRadius: 12,
          padding: space('md'),
        },
      ]}
    >
      <MaterialIcon name="event" size={20} color={colors.text.subdued} />
      <View style={{ flex: 1, marginLeft: space('md') }}>
        <AppText
          style={[
            textStyles.caption,
            { color: colors.text.secondary, fontFamily: fontFamilies.medium },
          ]}
        >
          {cadence ? cadenceDisplayLabel(cadence) : 'Scheduled'}
        </AppText>
        <AppText
          style={[
            textStyles.body,
            { color: colors.text.heading, fontFamily: fontFamilies.semibold },
          ]}
        >
          {formatDate(dueDate)}
        </AppText>
      </View>
      <MaterialIcon
        name="chevron_right"
        size={20}
        color={colors.text.subdued}
      />
    </View>
  );
};

interface CompletedItemProps {
  dueDate: string;
  status: 'completed' | 'missed';
}

const CompletedItem: React.FC<CompletedItemProps> = ({ dueDate, status }) => {
  const { colors, space, textStyles, fontFamilies } = useTheme();

  const formatDate = (iso: string): string => {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isMissed = status === 'missed';

  return (
    <View
      style={[
        styles.completedItem,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
          borderRadius: 12,
          padding: space('md'),
        },
      ]}
    >
      <MaterialIcon
        name={isMissed ? 'report' : 'check_circle'}
        size={20}
        color={isMissed ? colors.danger : colors.success}
      />
      <View style={{ flex: 1, marginLeft: space('md') }}>
        <AppText
          style={[
            textStyles.caption,
            { color: colors.text.secondary, fontFamily: fontFamilies.medium },
          ]}
        >
          {isMissed ? 'Missed' : 'Completed'}
        </AppText>
        <AppText
          style={[
            textStyles.body,
            { color: colors.text.heading, fontFamily: fontFamilies.semibold },
          ]}
        >
          {formatDate(dueDate)}
        </AppText>
      </View>
    </View>
  );
};

export const DewormingScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const tabBarInset = useAppTabBarInset();
  const { colors, space, textStyles, fontFamilies } = theme;

  const activePet = usePetStore(s => s.activePet);
  const { result, loading, hydrateAndGenerate, logCompletion, persistSymptoms, petState } =
    useDewormingStore();

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [logError, setLogError] = useState<string | null>(null);

  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const logDateBounds = useMemo((): {
    minimumDate: Date;
    maximumDate: Date;
  } | null => {
    if (!activePet?.dob || !result?.nextStep) {
      return null;
    }
    const cadence =
      result.nextStep.cadence ??
      getCadenceForDueDate(
        activePet.dob,
        result.nextStep.dueDate,
        activePet.lifestyle?.type ?? 'indoor',
      );
    const minIso = getMinimumLogDate(activePet.dob, todayDate, cadence);
    const [ymin, mmin, dmin] = minIso.split('-').map(Number);
    const [ymax, mmax, dmax] = todayDate.split('-').map(Number);
    return {
      minimumDate: new Date(ymin, mmin - 1, dmin),
      maximumDate: new Date(ymax, mmax - 1, dmax),
    };
  }, [activePet?.dob, activePet?.lifestyle?.type, result?.nextStep, todayDate]);

  useEffect(() => {
    if (activePet?.dob && activePet.lifestyle) {
      void hydrateAndGenerate(activePet);
    }
  }, [
    activePet?.id,
    activePet?.dob,
    activePet?.lifestyle?.type,
    hydrateAndGenerate,
  ]);

  const handleUpdatePress = () => {
    if (result?.nextStep) {
      setLogError(null);
      setSelectedDate(todayDate);
      setShowUpdateModal(true);
    }
  };

  const handleSaveDate = () => {
    const pet = activePet;
    if (
      !pet ||
      !selectedDate ||
      !result?.nextStep ||
      !pet.dob ||
      !pet.lifestyle
    ) {
      return;
    }
    const cadence =
      result.nextStep.cadence ??
      getCadenceForDueDate(pet.dob, result.nextStep.dueDate, pet.lifestyle.type);
    const check = validateLogDateForCadence(
      pet.dob,
      todayDate,
      selectedDate,
      cadence,
    );
    if (!check.ok) {
      setLogError(check.error);
      return;
    }
    setLogError(null);
    void logCompletion(selectedDate).then(() => {
      setShowUpdateModal(false);
    });
  };

  const symptomOptions: { key: DewormingSymptom; label: string }[] = [
    { key: 'vomiting', label: 'Vomiting' },
    { key: 'diarrhea', label: 'Diarrhea' },
    { key: 'bloated_belly', label: 'Bloating' },
    { key: 'worms_visible', label: 'Worms visible' },
  ];

  const selectedSymptoms = petState?.symptoms ?? [];
  const toggleSymptom = (key: DewormingSymptom): void => {
    const next = selectedSymptoms.includes(key)
      ? selectedSymptoms.filter(s => s !== key)
      : [...selectedSymptoms, key];
    void persistSymptoms(next);
  };

  if (!activePet) {
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
            No pet selected
          </AppText>
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => navigation.goBack()}
          style={[
            styles.backBtn,
            { backgroundColor: colors.brandTint10, borderRadius: 20 },
          ]}
        >
          <MaterialIcon name="arrow_back" size={20} color={colors.accent} />
        </Pressable>
        <View style={styles.headerTitle}>
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
            {activePet.name}'s Deworming
          </AppText>
          <AppText
            style={[
              textStyles.caption,
              { color: colors.text.secondary, fontFamily: fontFamilies.medium },
            ]}
            numberOfLines={1}
          >
            {result?.metadata.estimatedSchedule
              ? 'Estimated schedule'
              : result?.metadata.confidence === 'high'
              ? 'Based on your records'
              : result?.metadata.confidence === 'medium'
              ? 'Moderate confidence'
              : 'Limited history'}
          </AppText>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={[1]}
          keyExtractor={() => 'deworming-list'}
          renderItem={() => (
            <View style={{ paddingHorizontal: space('lg') }}>
              <Section title="NEXT STEP">
                {result?.nextStep ? (
                  <NextStepCard
                    dueDate={result.nextStep.dueDate}
                    status={result.nextStep.status}
                    urgency={result.metadata.urgency}
                    riskLevel={result.metadata.riskLevel}
                    cadence={result.nextStep.cadence}
                    onUpdate={handleUpdatePress}
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
                    <MaterialIcon
                      name="check_circle"
                      size={40}
                      color={colors.success}
                    />
                    <AppText
                      style={[
                        textStyles.body,
                        {
                          color: colors.text.secondary,
                          textAlign: 'center',
                          marginTop: space('sm'),
                        },
                      ]}
                    >
                      All caught up! No pending deworming.
                    </AppText>
                  </View>
                )}
              </Section>

              <Section title="SYMPTOMS (OPTIONAL)">
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space('sm') }}>
                  {symptomOptions.map(opt => {
                    const on = selectedSymptoms.includes(opt.key);
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => toggleSymptom(opt.key)}
                        style={[
                          styles.upcomingItem,
                          {
                            backgroundColor: on ? colors.brandTint10 : colors.surface,
                            borderColor: on ? colors.accent : colors.borderSubtle,
                            borderRadius: 12,
                            paddingHorizontal: space('md'),
                            paddingVertical: space('sm'),
                          },
                        ]}
                      >
                        <AppText
                          style={[
                            textStyles.caption,
                            {
                              color: on ? colors.accent : colors.text.secondary,
                              fontFamily: fontFamilies.medium,
                            },
                          ]}
                        >
                          {opt.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </Section>

              <Section title="COMING UP">
                {result && result.upcoming.length > 0 ? (
                  <View style={{ gap: space('sm') }}>
                    {result.upcoming
                      .slice(0, 3)
                      .map((item: ScheduleItem, index: number) => (
                        <UpcomingItem
                          key={`${item.dueDate}-${index}`}
                          dueDate={item.dueDate}
                          cadence={item.cadence}
                        />
                      ))}
                  </View>
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
                        { color: colors.text.subdued, textAlign: 'center' },
                      ]}
                    >
                      No upcoming deworming scheduled
                    </AppText>
                  </View>
                )}
              </Section>

              <Section title={`COMPLETED (${result?.completed.length ?? 0})`}>
                <View style={{ gap: space('sm') }}>
                  {result && result.completed.length > 0 ? (
                    result.completed
                      .filter(
                        (item: ScheduleItem) => item.status === 'completed',
                      )
                      .map((item: ScheduleItem, index: number) => (
                        <CompletedItem
                          key={`${item.dueDate}-${index}`}
                          dueDate={item.dueDate}
                          status="completed"
                        />
                      ))
                  ) : (
                    <AppText
                      style={[
                        textStyles.caption,
                        { color: colors.text.subdued, textAlign: 'center' },
                      ]}
                    >
                      No completed deworming logged yet
                    </AppText>
                  )}
                </View>
              </Section>

              <View style={{ height: tabBarInset + space('2xl') }} />
            </View>
          )}
          contentContainerStyle={{ paddingTop: space('md') }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        transparent
        visible={showUpdateModal}
        animationType="fade"
        onRequestClose={() => {
          setShowUpdateModal(false);
          setLogError(null);
        }}
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
              style={[
                textStyles.subtitle,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
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
                value={selectedDate}
                onChange={v => {
                  setLogError(null);
                  setSelectedDate(v);
                }}
                minimumDate={logDateBounds?.minimumDate}
                maximumDate={logDateBounds?.maximumDate ?? new Date()}
              />
            </View>
            {logError ? (
              <AppText
                style={[
                  textStyles.caption,
                  {
                    color: colors.danger,
                    marginTop: space('sm'),
                    fontFamily: fontFamilies.medium,
                  },
                ]}
              >
                {logError}
              </AppText>
            ) : null}

            <View style={[styles.modalActions, { marginTop: space('md') }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                onPress={() => {
                  setShowUpdateModal(false);
                  setLogError(null);
                }}
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
                accessibilityLabel="Save"
                onPress={handleSaveDate}
                style={[
                  styles.modalActionBtn,
                  { borderRadius: 12, backgroundColor: colors.accent },
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
  },
  card: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(238, 140, 43, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'stretch',
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  completedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
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
});

export default DewormingScreen;
