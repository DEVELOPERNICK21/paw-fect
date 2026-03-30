import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import type { HomeRootNavigation } from '../../../../app/navigation/types';
import { useAppTabBarInset } from '../../../../app/navigation/layout';
import { AppNavigation } from '../../../../app/navigation/navigationService';
import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { useHomeDashboardStore } from '../../store/homeDashboardStore';

import { HomeHeader } from '../../../../shared/components/HomeHeader';
import { HomeHealthSnapshotCard } from '../components/home/HomeHealthSnapshotCard';
import { HomePetSummaryCard } from '../components/home/HomePetSummaryCard';
import { TodayCareSection } from '../components/home/TodayCareSection';
import { UpcomingSection } from '../components/home/UpcomingSection';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeRootNavigation>();
  const tabBarInset = useAppTabBarInset();
  const theme = useTheme();
  const { colors, spacing, textStyles, shadows, radius } = theme;

  const viewModel = useHomeDashboardStore(s => s.viewModel);
  const requestDashboardRefresh = useHomeDashboardStore(
    s => s.requestDashboardRefresh,
  );

  useFocusEffect(
    useCallback(() => {
      requestDashboardRefresh();
    }, [requestDashboardRefresh]),
  );

  const goSettings = useCallback(() => {
    navigation.navigate('SettingsTab', { screen: 'Settings' });
  }, [navigation]);

  const goPetProfile = useCallback(() => {
    navigation.navigate('PetsTab', { screen: 'PetProfile' });
  }, [navigation]);

  const goAddReminder = useCallback(() => {
    navigation.navigate('RemindersTab', { screen: 'AddReminder' });
  }, [navigation]);

  const goReminderList = useCallback(() => {
    navigation.navigate('RemindersTab', { screen: 'ReminderList' });
  }, [navigation]);

  const goAddHealthRecord = useCallback(() => {
    navigation.navigate('HealthTab', { screen: 'AddHealthRecord' });
  }, [navigation]);

  const goProfileOrSettings = useCallback(() => {
    const pet = useHomeDashboardStore.getState().viewModel?.activePet;
    if (pet) {
      navigation.navigate('PetsTab', { screen: 'PetProfile' });
      return;
    }
    navigation.navigate('SettingsTab', { screen: 'Settings' });
  }, [navigation]);

  const viewportMinHeight = useMemo(
    () => Math.max(Dimensions.get('window').height, 884),
    [],
  );

  const showPetLoading =
    viewModel != null && viewModel.petsLoading && !viewModel.hasAnyPet;

  const showBlockingLoader = viewModel === null;
  const syncError = viewModel?.lastError ?? null;

  useEffect(() => {
    if (viewModel != null && !viewModel.petsLoading && !viewModel.hasAnyPet) {
      AppNavigation.toPetsAdd();
    }
  }, [viewModel]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}
    >
      <View style={styles.root}>
        <HomeHeader
          title="Pawfect"
          onPressMenu={goSettings}
          onPressProfile={goProfileOrSettings}
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
            contentContainerStyle={[
              styles.scrollContent,
              {
                minHeight: viewportMinHeight,
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.lg,
                paddingBottom: tabBarInset + spacing['3xl'],
                gap: spacing.xl,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {viewModel.activePet ? (
              <HomePetSummaryCard
                pet={viewModel.activePet}
                healthStatusLine={viewModel.healthStatusLine}
                nextMealLine={viewModel.nextMealLine}
                onPressViewProfile={goPetProfile}
                theme={theme}
              />
            ) : null}

            {viewModel.activePet ? (
              <>
                <TodayCareSection
                  items={viewModel.todayCare}
                  loading={viewModel.remindersLoading}
                  onPressAddReminder={goAddReminder}
                  onPressViewSchedule={goReminderList}
                  theme={theme}
                />
                <HomeHealthSnapshotCard
                  weightLine={viewModel.weightLine}
                  activityLine={viewModel.activityLine}
                  heartLine={viewModel.heartLine}
                  onPressLogActivity={goAddHealthRecord}
                  theme={theme}
                />
                <UpcomingSection
                  items={viewModel.upcoming}
                  loading={viewModel.remindersLoading}
                  onPressAddReminder={goAddReminder}
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
                  Add a pet profile to see care tasks and reminders here.
                </AppText>
              </View>
            )}
          </ScrollView>
        )}

        {!showBlockingLoader && !showPetLoading && viewModel != null ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add reminder"
            onPress={goAddReminder}
            style={[
              styles.fab,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.round,
                width: spacing['2xl'] + spacing.xl,
                height: spacing['2xl'] + spacing.xl,
                bottom: tabBarInset + spacing.lg,
                right: spacing.lg,
              },
              shadows.lg,
            ]}
          >
            <MaterialIcon name="add" size={24} color={colors.text.inverse} />
          </Pressable>
        ) : null}
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
  fab: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {},
});

export default HomeScreen;
