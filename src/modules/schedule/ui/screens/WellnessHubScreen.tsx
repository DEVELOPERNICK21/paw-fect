import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import type { WellnessHubRootNavigation } from '../../../../app/navigation/types';
import { useAppTabBarInset } from '../../../../app/navigation/layout';
import { getAppSessionUserId } from '../../../../shared/session/appSessionPorts';
import { AppText } from '../../../../shared/components/AppText';
import { Button } from '../../../../shared/components/Button';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { HomePetSwitcherBar } from '../../../app/ui/components/home/HomePetSwitcherBar';
import { usePetStore } from '../../../pets/store/petStore';
import { DEFAULT_PET_SCHEDULE_PREFERENCES } from '../../domain/DailyScheduleEngine';
import { isScheduleProUser } from '../../domain/models/ScheduleFeatureGates';
import { useSubscriptionStore } from '../../../subscription/store/subscriptionStore';
import { useScheduleStore } from '../../store/scheduleStore';
import { useWellnessStore } from '../../store/wellnessStore';
import { TodayCareSection } from '../components/TodayCareSection';

export const WellnessHubScreen: React.FC = () => {
  const navigation = useNavigation<WellnessHubRootNavigation>();
  const tabBarInset = useAppTabBarInset();
  const theme = useTheme();
  const { colors, spacing, radius, textStyles, fontFamilies, shadows } = theme;
  const entitlement = useSubscriptionStore(state => state.entitlement);
  const isPro = isScheduleProUser(entitlement.plan);
  const pets = usePetStore(state => state.pets);
  const activePet = usePetStore(state => state.activePet);
  const loadPets = usePetStore(state => state.loadPets);
  const setActivePet = usePetStore(state => state.setActivePet);
  const schedule = useScheduleStore(state => state.schedule);
  const preferences = useScheduleStore(state => state.preferences);
  const weekScores = useScheduleStore(state => state.weekScores);
  const loading = useScheduleStore(state => state.loading);
  const loadDaySchedule = useScheduleStore(state => state.loadDaySchedule);
  const loadPreferences = useScheduleStore(state => state.loadPreferences);
  const loadWeekScores = useScheduleStore(state => state.loadWeekScores);
  const hydrateDay = useWellnessStore(state => state.hydrateDay);
  const loadRelaxedMode = useWellnessStore(state => state.loadRelaxedMode);
  const completion = useWellnessStore(state => state.completion);

  const petId = activePet?.id ?? pets[0]?.id;
  const pet = pets.find(item => item.id === petId);

  const syncWellnessDay = useCallback(
    async (targetPetId: string) => {
      const targetPet = pets.find(item => item.id === targetPetId) ?? activePet;
      if (!targetPet) {
        return;
      }
      await loadPreferences(targetPetId);
      await loadDaySchedule(targetPetId, undefined, { skipNotificationSync: true });
      const latestSchedule = useScheduleStore.getState().schedule;
      const latestPrefs = useScheduleStore.getState().preferences;
      if (!latestSchedule || latestSchedule.petId !== targetPetId) {
        return;
      }
      const userId = getAppSessionUserId();
      if (userId) {
        loadRelaxedMode(userId);
      }
      await hydrateDay({
        petId: targetPetId,
        petName: targetPet.name,
        species: targetPet.type,
        blocks: latestSchedule.blocks,
        date: latestSchedule.date,
        isPro,
        ownerSleepTime:
          latestPrefs?.ownerSleepTime ??
          preferences?.ownerSleepTime ??
          DEFAULT_PET_SCHEDULE_PREFERENCES.ownerSleepTime,
      });
    },
    [activePet, hydrateDay, isPro, loadDaySchedule, loadPreferences, loadRelaxedMode, pets, preferences],
  );

  useFocusEffect(
    useCallback(() => {
      void loadPets().catch(() => {});
      if (petId) {
        void syncWellnessDay(petId);
        if (isPro) {
          void loadWeekScores(petId);
        }
      }
    }, [isPro, loadPets, loadWeekScores, petId, syncWellnessDay]),
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.backgroundAlt },
        header: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          gap: spacing.md,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
        },
        headerActions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        headerAction: {
          width: spacing['2xl'] + spacing.xs,
          height: spacing['2xl'] + spacing.xs,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surface,
        },
        content: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          gap: spacing.xl,
        },
        sectionLabel: {
          marginBottom: spacing.sm,
        },
        scoreCard: {
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surface,
          padding: spacing.xl,
          gap: spacing.sm,
        },
        weekRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: spacing.sm,
        },
        dot: {
          width: spacing.xl,
          height: spacing.xl,
          borderRadius: radius.round,
        },
        placeholderCard: {
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surfaceAlt,
          padding: spacing.xl,
          gap: spacing.md,
        },
      }),
    [colors, radius, spacing],
  );

  const weeklyAverage = useMemo(() => {
    if (weekScores.length === 0) {
      return completion.percentage || schedule?.completionPercent || 0;
    }
    const total = weekScores.reduce((sum, item) => sum + item.percent, 0);
    return Math.round(total / weekScores.length);
  }, [completion.percentage, schedule?.completionPercent, weekScores]);

  const handleOpenInbox = useCallback(() => {
    navigation.navigate('NotificationInbox');
  }, [navigation]);

  const handleOpenReminders = useCallback(() => {
    navigation.navigate('ReminderList');
  }, [navigation]);

  const handleOpenSetup = useCallback(() => {
    if (!petId) {
      return;
    }
    navigation.navigate('PetsTab', { screen: 'ScheduleSetup', params: { petId } });
  }, [navigation, petId]);

  const handleUpgrade = useCallback(() => {
    navigation.navigate('SettingsTab', { screen: 'Paywall', params: { source: 'settings' } });
  }, [navigation]);

  const headerActions = (
    <View style={styles.headerActions}>
      <Pressable
        style={styles.headerAction}
        onPress={handleOpenInbox}
        accessibilityRole="button"
        accessibilityLabel="Open notifications"
      >
        <MaterialIcon name="notifications" size={20} color={colors.text.heading} />
      </Pressable>
      <Pressable
        style={styles.headerAction}
        onPress={handleOpenReminders}
        accessibilityRole="button"
        accessibilityLabel="Open reminders"
      >
        <MaterialIcon name="schedule" size={20} color={colors.text.heading} />
      </Pressable>
    </View>
  );

  if (!pet) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={[styles.header, { paddingBottom: spacing.sm }]}>
          <View style={styles.titleRow}>
            <AppText
              style={[
                textStyles.title,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
            >
              Wellness
            </AppText>
            {headerActions}
          </View>
        </View>
        <View style={[styles.content, { paddingBottom: tabBarInset }]}>
          <View style={styles.placeholderCard}>
            <AppText
              style={[
                textStyles.title,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
            >
              Wellness starts with a pet profile
            </AppText>
            <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
              Add a pet to unlock today&apos;s care plan, weekly scores, and streaks.
            </AppText>
            <Button
              title="Add a pet"
              onPress={() => navigation.navigate('PetsTab', { screen: 'AddPet' })}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppText
            style={[
              textStyles.title,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
          >
            Wellness
          </AppText>
          {headerActions}
        </View>
        <HomePetSwitcherBar
          pets={pets}
          activePetId={petId ?? null}
          onSelectPet={nextPetId => {
            void (async () => {
              await setActivePet(nextPetId);
              await syncWellnessDay(nextPetId);
              if (isPro) {
                await loadWeekScores(nextPetId);
              }
            })();
          }}
          theme={theme}
        />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarInset }]}>
        <TodayCareSection
          pet={pet}
          onOpenSetup={handleOpenSetup}
          onUpgrade={handleUpgrade}
        />

        <View>
          <AppText
            style={[
              textStyles.caption,
              styles.sectionLabel,
              { color: colors.text.secondary, fontFamily: fontFamilies.semibold },
            ]}
          >
            Weekly wellness
          </AppText>
          <View style={[styles.scoreCard, shadows.sm]}>
            <AppText
              style={[
                textStyles.caption,
                { color: colors.text.secondary, fontFamily: fontFamilies.semibold },
              ]}
            >
              This week
            </AppText>
            <AppText
              style={[
                textStyles.title,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
            >
              {weeklyAverage} / 100
            </AppText>
            <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
              {pet.name}&apos;s care consistency score
            </AppText>
            <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
              Today&apos;s wellness score:{' '}
              {completion.percentage || schedule?.wellnessScore || schedule?.completionPercent || 0} / 100
            </AppText>
          </View>

          {isPro && weekScores.length > 0 ? (
            <View style={[styles.weekRow, { marginTop: spacing.md }]}>
              {weekScores.map(item => (
                <View key={item.date} style={{ alignItems: 'center', gap: spacing.xs }}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          item.percent >= 80
                            ? colors.success
                            : item.percent >= 50
                              ? colors.warning
                              : colors.danger,
                      },
                    ]}
                  />
                  <AppText style={[textStyles.footer, { color: colors.text.secondary }]}>
                    {item.percent}%
                  </AppText>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.placeholderCard, { marginTop: spacing.md }]}>
              <AppText
                style={[
                  textStyles.body,
                  { color: colors.text.heading, fontFamily: fontFamilies.semibold },
                ]}
              >
                {loading
                  ? 'Building this week’s wellness picture…'
                  : 'Complete a few care blocks to unlock the weekly calendar.'}
              </AppText>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WellnessHubScreen;
