import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme as NavigationTheme,
} from '@react-navigation/native';

import {
  bootstrapLocalNotifications,
  flushInitialNotificationNavigation,
  subscribeNotificationNavigation,
} from '../../infrastructure/notifications/notificationBootstrap';
import { notificationService } from '../../infrastructure/notifications/notificationService';
import {
  cancelDeferredNotificationResync,
  scheduleDeferredNotificationResync,
} from '../../infrastructure/notifications/deferredNotificationResync';
import { registerCrashlyticsUserSync } from '../../infrastructure/crashlytics/registerCrashlyticsUserSync';
import '../../modules/app/application/registerAppSessionPortSync';
import { appOrchestrator } from '../../modules/app/appComposition';
import { registerNotificationFeedSync } from '../../modules/notifications/bootstrap/registerNotificationFeedSync';
import { useHomeQuickActionsUsageStore } from '../../modules/app/store/homeQuickActionsUsageStore';
import { useNotificationFeedStore } from '../../modules/notifications/store/notificationFeedStore';
import SplashScreen from '../../modules/app/ui/screens/SplashScreen';
import {
  ensureAuthSessionListenerAttached,
  useAuthStore,
} from '../../modules/auth/store/authStore';
import { useSettingsStore } from '../../modules/settings/store/settingsStore';
import { usePetStore } from '../../modules/pets/store/petStore';
import { useReminderStore } from '../../modules/reminders/store/reminderStore';
import { MilestoneCelebrationsHost } from '../../modules/app/ui/components/celebration/MilestoneCelebrationsHost';
import { useRecordStore } from '../../modules/records/store/recordStore';
import { useSmartHealthRecordStore } from '../../modules/records/store/smartHealthRecordStore';
import { useSubscriptionStore } from '../../modules/subscription/store/subscriptionStore';
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
  const lastSyncedUserIdRef = useRef<string | null>(null);
  const authDataSyncGenerationRef = useRef(0);
  const appStateResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const hasCompletedOnboarding = settings?.onboardingCompleted ?? false;
  const petGateActive =
    bootstrapped &&
    isAuthenticated &&
    hasCompletedOnboarding &&
    !petsLoading &&
    pets.length === 0;

  const canNavigateNotificationRef = useRef(false);
  const updateNotificationNavGate = useCallback((): void => {
    canNavigateNotificationRef.current =
      isAuthenticated &&
      hasCompletedOnboarding &&
      !petsLoading &&
      pets.length > 0;
  }, [isAuthenticated, hasCompletedOnboarding, petsLoading, pets.length]);

  useEffect(() => {
    updateNotificationNavGate();
  }, [updateNotificationNavGate]);

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
    if (!bootstrapped) {
      return;
    }
    registerCrashlyticsUserSync();
    void bootstrapLocalNotifications().catch(() => {});
  }, [bootstrapped]);

  useEffect(() => {
    if (!bootstrapped) {
      return;
    }
    const unsub = subscribeNotificationNavigation(navigationRef, () =>
      canNavigateNotificationRef.current,
    );
    return unsub;
  }, [bootstrapped]);

  useEffect(() => {
    if (!bootstrapped) {
      return;
    }
    return registerNotificationFeedSync();
  }, [bootstrapped]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next !== 'active') {
        return;
      }
      if (appStateResumeTimerRef.current != null) {
        clearTimeout(appStateResumeTimerRef.current);
      }
      // Permission dialogs briefly background the app many times; debounce resume work.
      appStateResumeTimerRef.current = setTimeout(() => {
        appStateResumeTimerRef.current = null;
        refreshProfile().catch(() => {});
        if (
          useAuthStore.getState().isAuthenticated &&
          useAuthStore.getState().user?.id
        ) {
          void useSubscriptionStore.getState().refreshBootstrap();
          void loadReminders();
          scheduleDeferredNotificationResync(800);
        }
        void processPasswordResetQueue();
      }, 600);
    });
    return () => {
      if (appStateResumeTimerRef.current != null) {
        clearTimeout(appStateResumeTimerRef.current);
        appStateResumeTimerRef.current = null;
      }
      sub.remove();
    };
  }, [
    loadReminders,
    processPasswordResetQueue,
    refreshProfile,
  ]);

  useEffect(() => {
    if (!isSessionReady) {
      return undefined;
    }

    const subscriptionApi = useSubscriptionStore.getState();

    if (!isAuthenticated || !userId) {
      lastSyncedUserIdRef.current = null;
      subscriptionApi.stopListening();
      return undefined;
    }

    subscriptionApi.startListening(userId);
    void subscriptionApi.refreshBootstrap();

    return () => {
      subscriptionApi.stopListening();
    };
  }, [isAuthenticated, isSessionReady, userId]);

  useEffect(() => {
    if (!isSessionReady || !bootstrapped) {
      return undefined;
    }

    if (!isAuthenticated) {
      cancelDeferredNotificationResync();
      lastSyncedUserIdRef.current = null;
      useNotificationFeedStore.getState().clearAll();
      useHomeQuickActionsUsageStore.getState().reset();
      useSmartHealthRecordStore.getState().reset();
      appOrchestrator.clearSessionData({
        resetPets,
        resetReminders,
        resetRecords,
      });
      void notificationService.cancelAllNotifications();
      return undefined;
    }

    if (!userId) {
      return undefined;
    }

    const activeUserId = userId;
    const previousUserId = lastSyncedUserIdRef.current;
    const userChanged =
      previousUserId != null && previousUserId !== activeUserId;
    lastSyncedUserIdRef.current = activeUserId;

    const petState = usePetStore.getState();
    const skipCacheReset =
      !userChanged &&
      bootstrapped &&
      (petState.pets.length > 0 || petState.loading);

    const syncGeneration = authDataSyncGenerationRef.current + 1;
    authDataSyncGenerationRef.current = syncGeneration;

    void (async () => {
      try {
        if (skipCacheReset) {
          appOrchestrator.refreshHomeDashboardObservation();
          await Promise.all([loadReminders(), loadRecords()]);
          if (authDataSyncGenerationRef.current !== syncGeneration) {
            return;
          }
        } else {
          await appOrchestrator.syncAuthenticatedDataStores(
            {
              resetPets,
              resetReminders,
              resetRecords,
              loadPets,
              loadReminders,
              loadRecords,
            },
            { resetCaches: true },
          );
          if (authDataSyncGenerationRef.current !== syncGeneration) {
            return;
          }
        }
        scheduleDeferredNotificationResync();
      } catch {
        /* Avoid crashing the shell if a loader throws; stores keep last good state. */
      }
    })();

    return () => {
      authDataSyncGenerationRef.current += 1;
      cancelDeferredNotificationResync();
      appOrchestrator.stopHomeDashboardObservation();
    };
  }, [
    bootstrapped,
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

  let content: React.ReactElement = <AuthNavigator />;
  if (!hasCompletedOnboarding) {
    content = <OnboardingNavigator />;
  } else if (petGateActive) {
    content = <PetRequiredNavigator />;
  } else if (isAuthenticated) {
    content = <AppNavigator />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      onReady={() => {
        void flushInitialNotificationNavigation(navigationRef, () =>
          canNavigateNotificationRef.current,
        );
      }}
    >
      <>
        {content}
        <MilestoneCelebrationsHost />
      </>
    </NavigationContainer>
  );
};

export default RootNavigator;
