import React, { useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import type { HomeRootNavigation } from '../../../../app/navigation/types';
import { useAppTabBarInset } from '../../../../app/navigation/layout';
import { AppText } from '../../../../shared/components/AppText';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { useHomeDashboardStore } from '../../store/homeDashboardStore';
import {
  rankHomeQuickActions,
  type HomeQuickActionId,
  useHomeQuickActionsUsageStore,
} from '../../store/homeQuickActionsUsageStore';
import { useScheduleStore } from '../../../schedule/store/scheduleStore';
import { usePetStore } from '../../../pets/store/petStore';
import { useSettingsStore } from '../../../settings/store/settingsStore';

import { HomeHeader } from '../../../../shared/components/HomeHeader';
import { HomeAttentionBanner } from '../components/home/HomeAttentionBanner';
import { HomeTodayCarePreviewCard } from '../components/home/HomeTodayCarePreviewCard';
import { HomeNextMilestoneWidget } from '../components/home/HomeNextMilestoneWidget';
import { HomePetSummaryCard } from '../components/home/HomePetSummaryCard';
import { HomePetSwitcherBar } from '../components/home/HomePetSwitcherBar';
import { HomeQuickActionsRow } from '../components/home/HomeQuickActionsRow';
import { HomeUpcomingTasksWidget } from '../components/home/HomeUpcomingTasksWidget';
import { UpcomingSection } from '../components/home/UpcomingSection';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeRootNavigation>();
  const tabBarInset = useAppTabBarInset();
  const theme = useTheme();
  const { colors, spacing, textStyles, radius } = theme;

  const viewModel = useHomeDashboardStore(s => s.viewModel);
  const requestDashboardRefresh = useHomeDashboardStore(
    s => s.requestDashboardRefresh,
  );
  const pets = usePetStore(s => s.pets);
  const storeActivePetId = usePetStore(s => s.activePet?.id ?? null);
  const setActivePet = usePetStore(s => s.setActivePet);
  const loadPets = usePetStore(s => s.loadPets);
  const onboardingNickname = useSettingsStore(
    s => s.settings?.onboardingProfile?.pet.nickname?.trim() ?? '',
  );
  const recordQuickActionTap = useHomeQuickActionsUsageStore(s => s.recordTap);
  const quickActionCounts = useHomeQuickActionsUsageStore(s => s.counts);

  const schedule = useScheduleStore(s => s.schedule);
  const scheduleLoading = useScheduleStore(s => s.loading);
  const loadDaySchedule = useScheduleStore(s => s.loadDaySchedule);

  const activePetId = storeActivePetId ?? viewModel?.activePet?.id ?? null;

  useFocusEffect(
    useCallback(() => {
      const { pets: currentPets, loading: petsLoading } = usePetStore.getState();
      if (!petsLoading && currentPets.length === 0) {
        void loadPets().catch(() => {});
      }
      requestDashboardRefresh();
    }, [loadPets, requestDashboardRefresh]),
  );

  useEffect(() => {
    if (!activePetId) {
      return;
    }
    void loadDaySchedule(activePetId);
  }, [activePetId, loadDaySchedule]);

  const goPetProfile = useCallback(() => {
    navigation.navigate('PetsTab', { screen: 'PetProfile' });
  }, [navigation]);

  const goUserProfile = useCallback(() => {
    navigation.navigate('SettingsTab', { screen: 'UserProfile' });
  }, [navigation]);

  const goAddReminder = useCallback(() => {
    navigation.navigate('NotificationsTab', { screen: 'AddReminder' });
  }, [navigation]);

  const goNotifications = useCallback(() => {
    navigation.navigate('NotificationsTab', { screen: 'NotificationInbox' });
  }, [navigation]);

  const goWellness = useCallback(() => {
    navigation.navigate('NotificationsTab', { screen: 'WellnessHub' });
  }, [navigation]);

  const goScheduleSetup = useCallback(() => {
    if (!activePetId) {
      return;
    }
    navigation.navigate('PetsTab', {
      screen: 'ScheduleSetup',
      params: { petId: activePetId },
    });
  }, [activePetId, navigation]);

  const goHealthRecords = useCallback(() => {
    navigation.navigate('HealthTab', { screen: 'HealthRecords' });
  }, [navigation]);

  const goLogWeight = useCallback(() => {
    navigation.navigate('HealthTab', { screen: 'HealthRecords' });
  }, [navigation]);

  const viewportMinHeight = useMemo(
    () => Math.max(Dimensions.get('window').height - tabBarInset, 640),
    [tabBarInset],
  );

  const quickActionPool = useMemo((): HomeQuickActionId[] => {
    const base: HomeQuickActionId[] = [
      'log_weight',
      'alerts',
      'pet_profile',
      'user_profile',
    ];
    if (pets.length > 1) {
      return [...base, 'pet_switcher'];
    }
    return base;
  }, [pets.length]);

  const orderedQuickActionIds = useMemo(
    () => rankHomeQuickActions(quickActionPool, quickActionCounts).slice(0, 4),
    [quickActionPool, quickActionCounts],
  );

  const handleQuickAction = useCallback(
    (id: HomeQuickActionId) => {
      recordQuickActionTap(id);
      switch (id) {
        case 'log_weight':
          goLogWeight();
          break;
        case 'alerts':
          goNotifications();
          break;
        case 'pet_profile':
          goPetProfile();
          break;
        case 'user_profile':
          goUserProfile();
          break;
        case 'pet_switcher':
          navigation.navigate('PetsTab', { screen: 'PetSwitcher' });
          break;
        default:
          break;
      }
    },
    [
      recordQuickActionTap,
      goLogWeight,
      goNotifications,
      goPetProfile,
      goUserProfile,
      navigation,
    ],
  );

  const todayCarePreview = useMemo(() => {
    const blocks = schedule?.blocks ?? [];
    const nextBlock = blocks.find(block => !block.isCompleted) ?? null;
    return {
      completedCount: blocks.filter(block => block.isCompleted).length,
      totalCount: blocks.length,
      completionPercent: schedule?.completionPercent ?? 0,
      nextBlock: nextBlock
        ? {
            id: nextBlock.id,
            title: nextBlock.title,
            scheduledTime: nextBlock.scheduledTime,
            isCompleted: nextBlock.isCompleted,
          }
        : null,
      upcomingBlocks: blocks.map(block => ({
        id: block.id,
        title: block.title,
        scheduledTime: block.scheduledTime,
        isCompleted: block.isCompleted,
      })),
    };
  }, [schedule]);

  const showPetLoading =
    viewModel != null && viewModel.petsLoading && !viewModel.hasAnyPet;

  const showBlockingLoader = viewModel === null;
  const syncError = viewModel?.lastError ?? null;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}
    >
      <View style={styles.root}>
        <HomeHeader
          title="Pawsoul"
          onPressProfile={goUserProfile}
          theme={theme}
        />

        {syncError ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: colors.brandTint10, padding: spacing.md },
            ]}
          >
            <AppText
              style={[
                textStyles.caption,
                { color: colors.text.body, textAlign: 'center' },
              ]}
            >
              {syncError}
            </AppText>
          </View>
        ) : null}

        {showBlockingLoader || showPetLoading ? (
          <View style={[styles.centered, { flex: 1 }]}>
            <ActivityIndicator color={colors.primary} size="large" />
            <AppText
              style={[
                textStyles.caption,
                { color: colors.text.secondary, marginTop: spacing.md },
              ]}
            >
              Loading your pets…
            </AppText>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1, marginBottom: tabBarInset }}
            contentContainerStyle={[
              styles.scrollContent,
              {
                flexGrow: 1,
                minHeight: viewportMinHeight,
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.lg,
                paddingBottom: spacing['2xl'],
                gap: spacing.xl,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {viewModel?.activePet ? (
              <>
                <HomePetSwitcherBar
                  pets={pets}
                  activePetId={storeActivePetId ?? viewModel.activePet.id}
                  onSelectPet={petId => {
                    void (async () => {
                      await setActivePet(petId);
                      requestDashboardRefresh();
                      await loadDaySchedule(petId);
                    })();
                  }}
                  theme={theme}
                />
                <HomeAttentionBanner
                  banner={viewModel.attentionBanner}
                  onPress={goHealthRecords}
                  theme={theme}
                />
                <HomePetSummaryCard
                  pet={viewModel.activePet}
                  healthStatusLine={viewModel.healthStatusLine}
                  nextCareMilestoneLine={viewModel.nextCareMilestoneLine}
                  lastActivityLine={viewModel.lastActivityLine}
                  onPressViewProfile={goPetProfile}
                  theme={theme}
                />
                <HomeQuickActionsRow
                  orderedActionIds={orderedQuickActionIds}
                  onPressAction={handleQuickAction}
                  theme={theme}
                />
                <HomeTodayCarePreviewCard
                  petName={viewModel.activePet.name}
                  loading={scheduleLoading}
                  completedCount={todayCarePreview.completedCount}
                  totalCount={todayCarePreview.totalCount}
                  completionPercent={todayCarePreview.completionPercent}
                  nextBlock={todayCarePreview.nextBlock}
                  upcomingBlocks={todayCarePreview.upcomingBlocks}
                  onPressViewCare={goWellness}
                  onPressSetup={goScheduleSetup}
                  theme={theme}
                />
                <UpcomingSection
                  items={viewModel.weekCarePreview}
                  loading={viewModel.remindersLoading}
                  onPressOpenHealth={goHealthRecords}
                  theme={theme}
                />
                <View
                  style={{
                    flexGrow: 1,
                    minHeight: spacing.md,
                  }}
                />
                <HomeNextMilestoneWidget
                  pet={viewModel.activePet}
                  milestone={viewModel.nextMilestone}
                  onPressOpenHealth={goHealthRecords}
                  onPressPet={goPetProfile}
                  theme={theme}
                />
                <HomeUpcomingTasksWidget
                  items={viewModel.todayCare}
                  loading={viewModel.remindersLoading}
                  onPressAddTask={goAddReminder}
                  onPressRow={goWellness}
                  onPressViewSchedule={goWellness}
                  theme={theme}
                />
              </>
            ) : (
              <View
                style={[
                  styles.emptyPets,
                  {
                    borderRadius: radius.lg,
                    borderColor: colors.borderSubtle,
                    backgroundColor: colors.surfaceAlt,
                    padding: spacing.xl,
                    gap: spacing.md,
                  },
                ]}
              >
                <AppText
                  style={[
                    textStyles.body,
                    { color: colors.text.secondary, textAlign: 'center' },
                  ]}
                >
                  {onboardingNickname
                    ? `Ready to set up ${onboardingNickname}'s profile?`
                    : 'Add a pet profile to see care tasks and reminders here.'}
                </AppText>
              </View>
            )}
          </ScrollView>
        )}

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  scrollContent: {},
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPets: {
    borderWidth: 1,
  },
  banner: {},
});

export default HomeScreen;
