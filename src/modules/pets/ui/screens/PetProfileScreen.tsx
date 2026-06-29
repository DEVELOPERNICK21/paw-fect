import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import { resolvePetAvatarSource } from '../../../../shared/utils/petDisplayPhoto';
import {
  formatPetAgeLabel,
  formatPetBirthdayLabel,
} from '../../domain/utils/petDobDisplay';
import { getPawsitiveTip } from '../../domain/utils/getPawsitiveTip';
import type { HealthRecord } from '../../../records/domain/models/HealthRecord';

export const PetProfileScreen: React.FC = () => {
  const navigation = useNavigation<PetProfileRootNavigation>();
  const tabBarInset = useAppTabBarInset();
  const theme = useTheme();
  const { colors, spacing: spacingTokens, textStyles, fontFamilies } = theme;

  const activePet = usePetStore(s => s.activePet);
  const pets = usePetStore(s => s.pets);
  const setActivePet = usePetStore(s => s.setActivePet);
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

  const lastRefreshTime = useRef<number>(0);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastRefreshTime.current > 100) {
        lastRefreshTime.current = now;
        void loadPets().catch(() => {});
        setRecordsLoading(true);
        void loadRecords()
          .catch(() => {})
          .finally(() => setRecordsLoading(false));
        requestDashboardRefresh();
      }
    }, [loadPets, loadRecords, requestDashboardRefresh]),
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

  const goShareHealthCard = useCallback(() => {
    if (!petId) {
      return;
    }
    navigation.navigate('PetHealthCardShare', { petId });
  }, [navigation, petId]);

  const goAddPet = useCallback(() => {
    navigation.navigate('AddPet');
  }, [navigation]);

  const goPetSwitcher = useCallback(() => {
    navigation.navigate('PetSwitcher');
  }, [navigation]);

  const goAddHealthDetails = useCallback(
    (kind: 'weight' | 'vaccines' | 'conditions') => {
      navigation.navigate('AddHealthDetails', { kind });
    },
    [navigation],
  );

  const goAddHealthRecord = useCallback(() => {
    navigation.navigate('HealthTab', { screen: 'AddHealthRecord' });
  }, [navigation]);

  const goHealthRecords = useCallback(() => {
    navigation.navigate('HealthTab', { screen: 'HealthRecords' });
  }, [navigation]);

  const goDaySchedule = useCallback(() => {
    if (!petId) {
      return;
    }
    navigation.navigate('DayView', { petId });
  }, [navigation, petId]);

  const todayCare = dashboardVm?.todayCare ?? [];
  const todayCareLoading = dashboardVm == null;

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

  const heroPhotoSource = useMemo(() => {
    if (!effectivePet) {
      return null;
    }
    return resolvePetAvatarSource(effectivePet);
  }, [effectivePet?.id, effectivePet?.photo, effectivePet?.type]);

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
          photoSource={heroPhotoSource!}
          breedLabel={breedLabel}
          ageLine={ageLabel}
          locationLine={locationLine}
          onPressEdit={goEditPet}
          onPressShare={goShareHealthCard}
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

        <View>
          <PetProfileSectionHeader
            title="My Pets"
            rightElement={
              <Pressable
                onPress={goPetSwitcher}
                accessibilityRole="button"
                accessibilityLabel="View all pets"
              >
                <AppText
                  style={[
                    textStyles.caption,
                    { color: colors.accent, fontFamily: fontFamilies.bold },
                  ]}
                >
                  View all
                </AppText>
              </Pressable>
            }
          />
          <View style={styles.petChipsRow}>
            {pets.slice(0, 4).map(pet => {
              const isCurrent = pet.id === effectivePet.id;
              return (
                <Pressable
                  key={pet.id}
                  onPress={() => {
                    void setActivePet(pet.id);
                  }}
                  style={[
                    styles.petChip,
                    {
                      backgroundColor: isCurrent
                        ? colors.accent
                        : colors.surface,
                      borderColor: isCurrent
                        ? colors.accent
                        : colors.borderSubtle,
                    },
                  ]}
                >
                  <AppText
                    style={[
                      textStyles.caption,
                      {
                        color: isCurrent
                          ? colors.text.inverse
                          : colors.text.secondary,
                        fontFamily: isCurrent
                          ? fontFamilies.bold
                          : fontFamilies.medium,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {pet.name}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <PetProfileTodayCareSection
          items={todayCare}
          loading={todayCareLoading}
          onPressOpenHealthSchedule={goDaySchedule}
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
    heroPhotoSource,
    breedLabel,
    ageLabel,
    locationLine,
    goEditPet,
    goShareHealthCard,
    pets,
    setActivePet,
    goPetSwitcher,
    weightValue,
    birthdayValue,
    genderValue,
    overallPercent,
    nextAction.action,
    nextAction.label,
    goNextAction,
    todayCare,
    todayCareLoading,
    goHealthRecords,
    tip.body,
    tip.title,
    goAddHealthRecord,
    colors.text.subdued,
  ]);

  const listFooter = useMemo(() => {
    if (!effectivePet) {
      return null;
    }
    return <View style={{ height: spacingTokens.xl }} />;
  }, [effectivePet, spacingTokens.xl]);

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

      <View style={styles.mainWithFab}>
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
                    {
                      color: colors.text.heading,
                      fontFamily: fontFamilies.bold,
                    },
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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add another pet"
          onPress={goAddPet}
          style={({ pressed }) => [
            styles.addPetFab,
            theme.shadows.lg,
            {
              bottom: tabBarInset + spacingTokens.md,
              right: spacingTokens.lg,
              backgroundColor: colors.primary,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <MaterialIcon name="add" size={28} color={colors.text.inverse} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mainWithFab: {
    flex: 1,
  },
  addPetFab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
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
  petChipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  petChip: {
    borderWidth: 1,
    borderRadius: radiusTokens.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    maxWidth: 140,
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
