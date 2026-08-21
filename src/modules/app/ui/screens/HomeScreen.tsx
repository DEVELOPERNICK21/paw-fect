import React, { useCallback, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import type { HomeRootNavigation } from '../../../../app/navigation/types';
import { formatTabBadgeCount } from '../../../../app/navigation/components/tabBarBadge';
import { useAppTabBarInset } from '../../../../app/navigation/layout';
import { AppText } from '../../../../shared/components/AppText';
import { Button } from '../../../../shared/components/Button';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { resolvePetAvatarSource } from '../../../../shared/utils/petDisplayPhoto';
import { useHomeDashboardStore } from '../../store/homeDashboardStore';
import { useScheduleStore } from '../../../schedule/store/scheduleStore';
import { usePetStore } from '../../../pets/store/petStore';
import { useSettingsStore } from '../../../settings/store/settingsStore';
import {
  selectUnreadVisibleCount,
  useNotificationFeedStore,
} from '../../../notifications/store/notificationFeedStore';

import { HomeActionHealthCarousel } from '../components/home/HomeActionHealthCarousel';
import { HomeAttentionBanner } from '../components/home/HomeAttentionBanner';
import { HomeDashboardSkeleton } from '../components/home/HomeDashboardSkeleton';
import { HomeHealthSummaryCard } from '../components/home/HomeHealthSummaryCard';
import { HomeHeroBar } from '../components/home/HomeHeroBar';
import { HomePetSwitcherBar } from '../components/home/HomePetSwitcherBar';
import { HomeTodayTaskCarousel } from '../components/home/HomeTodayTaskCarousel';

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

  const schedule = useScheduleStore(s => s.schedule);
  const scheduleLoading = useScheduleStore(s => s.loading);
  const loadDaySchedule = useScheduleStore(s => s.loadDaySchedule);
  const markBlockDone = useScheduleStore(s => s.markBlockDone);
  const unreadCount = useNotificationFeedStore(s =>
    selectUnreadVisibleCount(s.itemsById),
  );

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

  const goUserProfile = useCallback(() => {
    navigation.navigate('SettingsTab', { screen: 'UserProfile' });
  }, [navigation]);

  const goAddPet = useCallback(() => {
    navigation.navigate('PetsTab', { screen: 'AddPet' });
  }, [navigation]);

  const goNotifications = useCallback(() => {
    navigation.navigate('NotificationsTab', { screen: 'NotificationInbox' });
  }, [navigation]);

  const goWellness = useCallback(() => {
    navigation.navigate('NotificationsTab', { screen: 'WellnessHub' });
  }, [navigation]);

  const goPetSwitcher = useCallback(() => {
    navigation.navigate('PetsTab', { screen: 'PetSwitcher' });
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

  const goHealthRecord = useCallback(
    (recordId: string) => {
      navigation.navigate('HealthTab', {
        screen: 'HealthRecords',
        params: {
          focusRecordId: recordId,
          petId: activePetId ?? undefined,
        },
      });
    },
    [activePetId, navigation],
  );

  const todayTasks = useMemo(
    () =>
      (schedule?.blocks ?? []).map(block => ({
        id: block.id,
        title: block.title,
        scheduledTime: block.scheduledTime,
        isCompleted: block.isCompleted,
      })),
    [schedule],
  );

  const remainingCount = useMemo(
    () => todayTasks.filter(task => !task.isCompleted).length,
    [todayTasks],
  );

  const handleCompleteTask = useCallback(
    (taskId: string) => {
      void markBlockDone(taskId, true).catch(() => {});
    },
    [markBlockDone],
  );

  const showPetLoading =
    viewModel != null && viewModel.petsLoading && !viewModel.hasAnyPet;
  const showBlockingLoader = viewModel === null;
  const syncError = viewModel?.lastError ?? null;
  const petPhoto = viewModel?.activePet
    ? resolvePetAvatarSource(viewModel.activePet)
    : undefined;

  const showHeroWell = Boolean(viewModel?.activePet) && !showBlockingLoader && !showPetLoading;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[
        styles.safeArea,
        {
          backgroundColor: showHeroWell
            ? colors.brandTint20
            : colors.backgroundAlt,
        },
      ]}
    >
      <View style={styles.root}>
        {syncError ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: colors.brandTint10, padding: spacing.sm },
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
          <View
            style={[
              styles.skeletonWrap,
              {
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.md,
              },
            ]}
          >
            <HomeDashboardSkeleton theme={theme} />
          </View>
        ) : (
          <ScrollView
            style={[styles.scroll, { backgroundColor: colors.backgroundAlt }]}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: tabBarInset + spacing.xl,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {viewModel?.activePet && petPhoto ? (
              <>
                <HomeHeroBar
                  petName={viewModel.activePet.name}
                  petPhoto={petPhoto}
                  unreadBadge={formatTabBadgeCount(unreadCount)}
                  remainingCount={remainingCount}
                  onPressPetContext={goPetSwitcher}
                  onPressAlerts={goNotifications}
                  onPressProfile={goUserProfile}
                  onPressJumpToCare={goWellness}
                  theme={theme}
                />
                <View
                  style={[
                    styles.body,
                    {
                      paddingHorizontal: spacing.lg,
                      gap: spacing.xl,
                    },
                  ]}
                >
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
                <HomeTodayTaskCarousel
                  petName={viewModel.activePet.name}
                  petPhoto={petPhoto}
                  loading={scheduleLoading}
                  tasks={todayTasks}
                  onPressSeeAll={goWellness}
                  onPressSetup={goScheduleSetup}
                  onPressComplete={handleCompleteTask}
                  theme={theme}
                />
                <HomeActionHealthCarousel
                  petName={viewModel.activePet.name}
                  petPhoto={petPhoto}
                  items={viewModel.actionHealthItems}
                  onPressSeeAll={goHealthRecords}
                  onPressItem={goHealthRecord}
                  theme={theme}
                />
                <HomeHealthSummaryCard
                  petName={viewModel.activePet.name}
                  petPhoto={petPhoto}
                  fallbackPhoto={resolvePetAvatarSource({
                    type: viewModel.activePet.type,
                    photo: null,
                  })}
                  weightLine={viewModel.weightLine}
                  healthStatusLine={viewModel.healthStatusLine}
                  lastLoggedDateLine={viewModel.lastLoggedDateLine}
                  onPressSeeAll={goHealthRecords}
                  theme={theme}
                />
                </View>
              </>
            ) : (
              <View
                style={[
                  styles.emptyPets,
                  {
                    borderRadius: radius.xl,
                    borderColor: colors.borderSubtle,
                    backgroundColor: colors.surface,
                    padding: spacing.xl,
                    marginHorizontal: spacing.lg,
                    marginTop: spacing.lg,
                    gap: spacing.md,
                  },
                ]}
              >
                <AppText
                  style={[textStyles.body, { color: colors.text.secondary }]}
                >
                  {onboardingNickname
                    ? `Ready to set up ${onboardingNickname}'s profile?`
                    : 'Add a pet to see today’s care and health here.'}
                </AppText>
                <Button title="Add pet" onPress={goAddPet} />
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  body: {},
  skeletonWrap: {
    flex: 1,
  },
  emptyPets: {
    borderWidth: 1,
  },
  banner: {},
});

export default HomeScreen;
