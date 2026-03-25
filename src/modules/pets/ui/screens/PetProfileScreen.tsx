import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTabBarInset } from '../../../../app/navigation/layout';
import type { PetProfileRootNavigation } from '../../../../app/navigation/types';
import { PetProfileHeroCard } from '../components/profile/PetProfileHeroCard';
import { PetProfileHealthRecordCard } from '../components/profile/PetProfileHealthRecordCard';
import { PetProfileQuickStatsRow } from '../components/profile/PetProfileQuickStatsRow';
import { PetProfileSectionHeader } from '../components/profile/PetProfileSectionHeader';
import { PetProfileTodayCareSection } from '../components/profile/PetProfileTodayCareSection';
import { PetProfileTipCard } from '../components/profile/PetProfileTipCard';
import { PetProfileUpcomingTeaserCard } from '../components/profile/PetProfileUpcomingTeaserCard';

import { HomeHeader } from '../../../../shared/components/HomeHeader';
import { AppText } from '../../../../shared/components/AppText';
import { Button } from '../../../../shared/components/Button';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { spacing } from '../../../../shared/theme/spacing';
import { radius as radiusTokens } from '../../../../shared/theme/radius';
import { icons } from '../../../../shared/assets/icons';

import { useHomeDashboardStore } from '../../../app/store/homeDashboardStore';
import { usePetStore } from '../../store/petStore';
import { useRecordStore } from '../../../records/store/recordStore';

import { getLatestWeightDisplayForPet } from '../../../../shared/utils/healthRecordWeight';
import { isPetPhotoPlaceholderUri } from '../../domain/utils/petPhotoPlaceholder';
import {
  formatPetAgeLabel,
  formatPetBirthdayLabel,
} from '../../domain/utils/petDobDisplay';
import { getPawsitiveTip } from '../../domain/utils/getPawsitiveTip';
import type { HealthRecord } from '../../../records/domain/models/HealthRecord';
import type { HomeDashboardUpcomingItem } from '../../../app/domain/models/HomeDashboardViewModel';

const FALLBACK_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAQXZRqux3dGiKVHxg69tsjQga2xzb_Z44MMFEOFTW1lkUd8j1zSaK6EKRCHN9n9PX6s6XdsbTaJqSwqhhSOG2KITXiPsnHHNzGMbccqz_MCcJEaxfYujRzatpy05j5j3o37UTqn0RlfNQ7en9mHWZZPMAd014HsyIn9qbrvdaa482zs4BhKiuI2OFZxAv6h0wGYRDxyTTVxIA7D8xBrCujbnv8b8Qs-WZGBgxxsmBN2dtSukXRhVKftZOZptWGBrodXRCxgTLQWlQR';

export const PetProfileScreen: React.FC = () => {
  const navigation = useNavigation<PetProfileRootNavigation>();
  const tabBarInset = useAppTabBarInset();
  const theme = useTheme();
  const { colors, spacing: spacingTokens, textStyles, fontFamilies } = theme;

  const activePet = usePetStore(s => s.activePet);
  const loadPets = usePetStore(s => s.loadPets);
  const loading = usePetStore(s => s.loading);
  const loadError = usePetStore(s => s.loadError);

  const requestDashboardRefresh = useHomeDashboardStore(
    s => s.requestDashboardRefresh,
  );
  const dashboardVm = useHomeDashboardStore(s => s.viewModel);

  const records = useRecordStore(s => s.records);
  const loadRecords = useRecordStore(s => s.loadRecords);

  const effectivePet = dashboardVm?.activePet ?? activePet;
  const petId = effectivePet?.id ?? null;

  const [recordsLoading, setRecordsLoading] = useState(false);

  useEffect(() => {
    void loadPets().catch(() => {});
    setRecordsLoading(true);
    void loadRecords()
      .catch(() => {})
      .finally(() => setRecordsLoading(false));
  }, [loadPets, loadRecords]);

  const lastDashboardRefreshPetId = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const nextPetId = activePet?.id ?? null;
      if (lastDashboardRefreshPetId.current === nextPetId) {
        return;
      }
      lastDashboardRefreshPetId.current = nextPetId;
      requestDashboardRefresh();
    }, [activePet?.id, requestDashboardRefresh]),
  );

  const goSettings = useCallback(() => {
    navigation.navigate('SettingsTab', { screen: 'Settings' });
  }, [navigation]);

  const goEditPet = useCallback(() => {
    if (!effectivePet) {
      return;
    }
    navigation.navigate('AddPet', { petId: effectivePet.id });
  }, [navigation, effectivePet]);

  const goAddHealthDetails = useCallback(
    (kind: 'weight' | 'vaccines' | 'conditions') => {
      navigation.navigate('AddHealthDetails', { kind });
    },
    [navigation],
  );

  const goReminderList = useCallback(() => {
    navigation.navigate('RemindersTab', { screen: 'ReminderList' });
  }, [navigation]);

  const goAddReminder = useCallback(() => {
    navigation.navigate('RemindersTab', { screen: 'AddReminder' });
  }, [navigation]);

  const goAddHealthRecord = useCallback(() => {
    navigation.navigate('HealthTab', { screen: 'AddHealthRecord' });
  }, [navigation]);

  const goHealthRecords = useCallback(() => {
    navigation.navigate('HealthTab', { screen: 'HealthRecords' });
  }, [navigation]);

  const todayCare = dashboardVm?.todayCare ?? [];
  const todayCareLoading = dashboardVm == null;

  const upcomingItem: HomeDashboardUpcomingItem | null =
    dashboardVm?.upcoming?.[0] ?? null;

  const recordsForPet: HealthRecord[] = useMemo(() => {
    if (!petId) {
      return [];
    }
    return records
      .filter(r => r.petId === petId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, petId]);

  const weightValue = useMemo(() => {
    if (!petId) {
      return '—';
    }
    const derived = getLatestWeightDisplayForPet(records, petId);
    return (dashboardVm?.weightLine ?? derived) || '—';
  }, [petId, records, dashboardVm?.weightLine]);

  const birthdayValue = formatPetBirthdayLabel(effectivePet?.dob);

  const ageLabel = formatPetAgeLabel(effectivePet?.dob);
  const locationLine = 'San Francisco, CA';

  const breedLabel = (effectivePet?.breed?.trim() || 'Not set').toUpperCase();
  const tip = effectivePet
    ? getPawsitiveTip(effectivePet)
    : { title: 'Pawsitive Tip', body: '' };

  const genderValue = useMemo(() => {
    const g = effectivePet?.gender;
    if (!g) {
      return '—';
    }
    if (g === 'male') {
      return 'Male';
    }
    if (g === 'female') {
      return 'Female';
    }
    return 'Unknown';
  }, [effectivePet?.gender]);

  const photoOk = useMemo(() => {
    const p = effectivePet?.photo?.trim();
    return !!p && !isPetPhotoPlaceholderUri(p);
  }, [effectivePet?.photo]);

  const dobOk = useMemo(() => {
    const raw = effectivePet?.dob?.trim();
    if (!raw) {
      return false;
    }
    const d = new Date(raw.length === 10 ? `${raw}T00:00:00` : raw);
    if (Number.isNaN(d.getTime())) {
      return false;
    }
    return d.getTime() <= Date.now();
  }, [effectivePet?.dob]);

  const nameOk = useMemo(
    () => (effectivePet?.name?.trim().length ?? 0) > 0,
    [effectivePet?.name],
  );
  const typeOk = useMemo(
    () => effectivePet?.type != null,
    [effectivePet?.type],
  );
  const genderOk = useMemo(
    () => effectivePet?.gender != null,
    [effectivePet?.gender],
  );

  const requiredCoreComplete = useMemo(
    () => nameOk && typeOk && dobOk && genderOk,
    [dobOk, genderOk, nameOk, typeOk],
  );

  // Core identity completion percent (DOB & Gender are required; photo is a bonus).
  // With only name + type (2 of 5), we show 40%.
  const coreScore = useMemo(() => {
    let score = 0;
    if (nameOk) score += 1;
    if (typeOk) score += 1;
    if (dobOk) score += 1;
    if (genderOk) score += 1;
    if (photoOk) score += 1;
    return score;
  }, [dobOk, genderOk, nameOk, photoOk, typeOk]);

  const coreMax = 5;
  const corePercent = Math.round((coreScore / coreMax) * 100);

  const vaccinesOk = useMemo(() => {
    return recordsForPet.some(r => {
      const haystack = `${r.title} ${r.category} ${r.notes}`.toLowerCase();
      return /\bvaccin/i.test(haystack) || /\brabies/i.test(haystack);
    });
  }, [recordsForPet]);

  const conditionsOk = useMemo(() => {
    return recordsForPet.some(r => {
      const haystack = `${r.title} ${r.category} ${r.notes}`.toLowerCase();
      return (
        /\bcondition\b/.test(haystack) ||
        /\ballerg/.test(haystack) ||
        /\b(symptom|disease)\b/.test(haystack)
      );
    });
  }, [recordsForPet]);

  const weightOk = useMemo(() => {
    if (!petId) {
      return false;
    }
    const derived = getLatestWeightDisplayForPet(recordsForPet, petId);
    return derived !== '—';
  }, [petId, recordsForPet]);

  const healthScore = useMemo(() => {
    let score = 0;
    if (weightOk) score += 1;
    if (vaccinesOk) score += 1;
    if (conditionsOk) score += 1;
    return score;
  }, [conditionsOk, vaccinesOk, weightOk]);

  const healthOverall = 70 + Math.round((healthScore / 3) * 30);
  const overallPercent = requiredCoreComplete
    ? Math.max(corePercent, healthOverall)
    : corePercent;

  const nextAction = useMemo(() => {
    if (!requiredCoreComplete) {
      if (!dobOk || !genderOk) {
        return {
          label: 'Complete DOB & Gender',
          action: 'coreIdentity' as const,
        };
      }
      return { label: 'Edit profile', action: 'coreIdentity' as const };
    }

    if (!weightOk) {
      return { label: 'Add weight', action: 'health_weight' as const };
    }
    if (!vaccinesOk) {
      return { label: 'Add vaccines', action: 'health_vaccines' as const };
    }
    if (!conditionsOk) {
      return { label: 'Add conditions', action: 'health_conditions' as const };
    }
    return { label: 'All set', action: 'done' as const };
  }, [
    conditionsOk,
    dobOk,
    genderOk,
    requiredCoreComplete,
    vaccinesOk,
    weightOk,
  ]);

  const goNextAction = useCallback(() => {
    if (!effectivePet) return;
    if (nextAction.action === 'done') {
      return;
    }
    if (nextAction.action === 'coreIdentity') {
      navigation.navigate('AddPet', { petId: effectivePet.id });
      return;
    }
    if (nextAction.action === 'health_weight') {
      goAddHealthDetails('weight');
      return;
    }
    if (nextAction.action === 'health_vaccines') {
      goAddHealthDetails('vaccines');
      return;
    }
    if (nextAction.action === 'health_conditions') {
      goAddHealthDetails('conditions');
      return;
    }
  }, [effectivePet, goAddHealthDetails, navigation, nextAction.action]);

  const renderRecordItem = useCallback(
    ({ item }: { item: HealthRecord }) => (
      <PetProfileHealthRecordCard
        record={item}
        onPressDetails={goHealthRecords}
      />
    ),
    [goHealthRecords],
  );

  const keyExtractor = useCallback((item: HealthRecord) => item.id, []);

  const itemSeparator = useCallback(
    () => <View style={{ height: spacingTokens.md }} />,
    [spacingTokens.md],
  );

  const listHeader = useMemo(() => {
    if (!effectivePet) {
      return null;
    }

    return (
      <View style={styles.listHeader}>
        <PetProfileHeroCard
          pet={effectivePet}
          photoUri={effectivePet.photo ?? FALLBACK_IMAGE}
          breedLabel={breedLabel}
          ageLine={ageLabel}
          locationLine={locationLine}
          onPressEdit={goEditPet}
        />

        <PetProfileQuickStatsRow
          weightValue={weightValue}
          genderValue={genderValue}
          birthdayValue={birthdayValue}
          petGender={effectivePet?.gender}
        />

        <View
          style={[
            styles.completionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <View style={styles.completionTopRow}>
            <AppText
              style={[
                textStyles.subtitle,
                {
                  color: colors.text.heading,
                  fontFamily: fontFamilies.bold,
                },
              ]}
              numberOfLines={1}
            >
              {overallPercent}% profile complete
            </AppText>

            {effectivePet?.syncStatus === 'pending' ? (
              <View
                style={[
                  styles.syncPill,
                  {
                    backgroundColor: colors.infoSurface,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <MaterialIcon name="repeat" size={14} color={colors.info} />
                <AppText
                  style={[
                    textStyles.overline,
                    { color: colors.info, fontFamily: fontFamilies.semibold },
                  ]}
                >
                  Sync pending
                </AppText>
              </View>
            ) : effectivePet?.syncStatus === 'failed' ? (
              <View
                style={[
                  styles.syncPill,
                  {
                    backgroundColor: 'rgba(239, 68, 68, 0.16)',
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <MaterialIcon name="info" size={14} color={colors.danger} />
                <AppText
                  style={[
                    textStyles.overline,
                    { color: colors.danger, fontFamily: fontFamilies.semibold },
                  ]}
                >
                  Sync failed
                </AppText>
              </View>
            ) : null}
          </View>

          <AppText
            style={[
              textStyles.body,
              {
                color: colors.text.subdued,
                marginTop: spacingTokens.xs,
              },
            ]}
            numberOfLines={2}
          >
            Next: {nextAction.label}
          </AppText>

          <Pressable
            onPress={nextAction.action === 'done' ? undefined : goNextAction}
            accessibilityRole="button"
            accessibilityLabel={`Profile action: ${nextAction.label}`}
            style={({ pressed }) => [
              styles.completionCta,
              {
                backgroundColor:
                  nextAction.action === 'done'
                    ? colors.borderSubtle
                    : colors.accent,
                opacity:
                  nextAction.action === 'done' ? 0.7 : pressed ? 0.92 : 1,
              },
            ]}
          >
            <MaterialIcon
              name="add_circle"
              size={18}
              color={colors.text.inverse}
            />
            <AppText
              style={[
                textStyles.subtitle,
                { color: colors.text.inverse, fontFamily: fontFamilies.bold },
              ]}
              numberOfLines={1}
            >
              {nextAction.label}
            </AppText>
          </Pressable>
        </View>

        <PetProfileTodayCareSection
          items={todayCare}
          loading={todayCareLoading}
          onPressViewCalendar={goReminderList}
        />

        <PetProfileTipCard title={tip.title} body={tip.body} />

        <PetProfileSectionHeader
          title="Health Records"
          rightElement={
            <Pressable
              onPress={goAddHealthRecord}
              accessibilityRole="button"
              accessibilityLabel="Add health record"
            >
              <MaterialIcon
                name="add_circle"
                size={22}
                color={colors.text.subdued}
              />
            </Pressable>
          }
        />
      </View>
    );
  }, [
    effectivePet,
    breedLabel,
    ageLabel,
    locationLine,
    goEditPet,
    weightValue,
    birthdayValue,
    genderValue,
    overallPercent,
    nextAction.action,
    nextAction.label,
    goNextAction,
    todayCare,
    todayCareLoading,
    goReminderList,
    tip.body,
    tip.title,
    goAddHealthRecord,
    colors.text.subdued,
  ]);

  const listFooter = useMemo(() => {
    if (!effectivePet) {
      return null;
    }
    if (!upcomingItem) {
      return <View style={{ height: spacingTokens.xl }} />;
    }

    return (
      <View style={{ gap: spacingTokens.lg }}>
        <PetProfileUpcomingTeaserCard
          title={upcomingItem.reminder.title}
          onPressSchedule={goAddReminder}
        />
        <View style={{ height: spacingTokens.xl }} />
      </View>
    );
  }, [
    effectivePet,
    upcomingItem,
    goAddReminder,
    spacingTokens.lg,
    spacingTokens.xl,
  ]);

  if (loading && !effectivePet) {
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

  if (loadError && !effectivePet) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}
      >
        <HomeHeader
          title="Pawfect"
          onPressMenu={goSettings}
          onPressProfile={goSettings}
          theme={theme}
        />
        <View
          style={[
            styles.stateCard,
            {
              backgroundColor: colors.surfaceAlt,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <MaterialIcon name="info" size={34} color={colors.accent} />
          <AppText
            style={[
              textStyles.subtitle,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
          >
            {loadError}
          </AppText>
          <Button
            title="Retry"
            onPress={() => void loadPets().catch(() => {})}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!effectivePet) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}
      >
        <HomeHeader
          title="Pawfect"
          onPressMenu={goSettings}
          onPressProfile={goSettings}
          theme={theme}
        />
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
                { color: colors.text.body, textAlign: 'center' },
              ]}
            >
              Add a pet profile to see details here.
            </AppText>
            <Button
              title="Add pet"
              onPress={() => navigation.navigate('AddPet')}
            />
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
      <HomeHeader
        title="Pawfect"
        onPressMenu={goSettings}
        onPressProfile={goSettings}
        theme={theme}
      />

      <FlatList
        data={recordsForPet}
        keyExtractor={keyExtractor}
        renderItem={renderRecordItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={
          recordsLoading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <MaterialIcon
                name="stethoscope"
                size={38}
                color={colors.accent}
              />
              <AppText
                style={[
                  textStyles.subtitle,
                  { color: colors.text.heading, fontFamily: fontFamilies.bold },
                ]}
              >
                No health records yet
              </AppText>
              <Button title="Add health record" onPress={goAddHealthRecord} />
            </View>
          )
        }
        ItemSeparatorComponent={itemSeparator}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: tabBarInset + spacingTokens['2xl'],
          },
        ]}
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
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.md * 1.7,
    paddingTop: spacing.md,
  },
  listHeader: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  completionCard: {
    borderWidth: 1,
    borderRadius: radiusTokens.lg,
    padding: spacing.lg,
    gap: 10,
  },
  completionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  completionCta: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loaderWrap: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderRadius: radiusTokens.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: radiusTokens.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
});

export default PetProfileScreen;
