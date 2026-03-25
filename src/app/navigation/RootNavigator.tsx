import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme as NavigationTheme,
} from '@react-navigation/native';

import { appOrchestrator } from '../../modules/app/appComposition';
import SplashScreen from '../../modules/app/ui/screens/SplashScreen';
import {
  ensureAuthSessionListenerAttached,
  useAuthStore,
} from '../../modules/auth/store/authStore';
import { useSettingsStore } from '../../modules/settings/store/settingsStore';
import { usePetStore } from '../../modules/pets/store/petStore';
import { useReminderStore } from '../../modules/reminders/store/reminderStore';
import { useRecordStore } from '../../modules/records/store/recordStore';
import { useTheme } from '../../shared/hooks/useTheme';

import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { navigationRef } from './navigationRef';
import { PetRequiredNavigator } from './PetRequiredNavigator';

export const RootNavigator: React.FC = () => {
  const {
    isAuthenticated,
    isSessionReady,
    loadCurrentUser,
    refreshProfile,
    processPasswordResetQueue,
  } = useAuthStore();
  const userId = useAuthStore(state => state.user?.id);
  const { settings, loadSettings } = useSettingsStore();
  const loadPets = usePetStore(state => state.loadPets);
  const pets = usePetStore(state => state.pets);
  const petsLoading = usePetStore(state => state.loading);
  const resetPets = usePetStore(state => state.reset);
  const loadReminders = useReminderStore(state => state.loadReminders);
  const resetReminders = useReminderStore(state => state.reset);
  const loadRecords = useRecordStore(state => state.loadRecords);
  const resetRecords = useRecordStore(state => state.reset);
  const { colors, isDarkMode } = useTheme();
  const [bootstrapped, setBootstrapped] = useState(false);

  const navigationTheme: NavigationTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text.primary,
      border: colors.border,
      notification: colors.accent,
    },
  };

  useEffect(() => {
    const bootstrap = async () => {
      // Load current user first so pet storage keys are correctly namespaced.
      await loadCurrentUser();
      await Promise.all([loadSettings(), loadPets()]);
      ensureAuthSessionListenerAttached();
      setBootstrapped(true);
    };

    bootstrap();
  }, [loadCurrentUser, loadSettings, loadPets]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active') {
        refreshProfile().catch(() => {});
        void processPasswordResetQueue();
      }
    });
    return () => sub.remove();
  }, [processPasswordResetQueue, refreshProfile]);

  useEffect(() => {
    if (!isSessionReady) {
      return;
    }

    if (!isAuthenticated) {
      appOrchestrator.clearSessionData({
        resetPets,
        resetReminders,
        resetRecords,
      });
      return;
    }

    void appOrchestrator.syncAuthenticatedDataStores({
      resetPets,
      resetReminders,
      resetRecords,
      loadPets,
      loadReminders,
      loadRecords,
    });

    return () => {
      appOrchestrator.stopHomeDashboardObservation();
    };
  }, [
    isAuthenticated,
    isSessionReady,
    userId,
    loadPets,
    loadReminders,
    loadRecords,
    resetPets,
    resetReminders,
    resetRecords,
  ]);

  if (!bootstrapped) {
    return <SplashScreen />;
  }

  const hasCompletedOnboarding = settings?.onboardingCompleted ?? false;

  const petGateActive =
    isAuthenticated && hasCompletedOnboarding && !petsLoading && pets.length === 0;

  let content: React.ReactElement = <AuthNavigator />;
  if (!hasCompletedOnboarding) {
    content = <OnboardingNavigator />;
  } else if (petGateActive) {
    content = <PetRequiredNavigator />;
  } else if (isAuthenticated) {
    content = <AppNavigator />;
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      {content}
    </NavigationContainer>
  );
};

export default RootNavigator;
