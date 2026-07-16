import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '../../config/posthog';

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
import { useOnboardingDraftStore } from '../../modules/app/store/onboardingDraftStore';
import { resolveOnboardingGate } from '../../modules/app/domain/onboarding/resolveOnboardingGate';
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
import { runBootNotificationResyncIfNeeded } from '../../infrastructure/notifications/notificationBoot';
import { startupError, startupLog } from '../../infrastructure/logging/startupLog';

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
  const onboardingPhase = useOnboardingDraftStore(state => state.draft.phase);
  const onboardingCommitmentAccepted = useOnboardingDraftStore(
    state => state.draft.commitmentAccepted,
  );
  const setOnboardingPhase = useOnboardingDraftStore(state => state.setPhase);
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
  const routeNameRef = useRef<string | undefined>();
  const authDataSyncGenerationRef = useRef(0);
  const appStateResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const hasCompletedOnboarding = settings?.onboardingCompleted ?? false;
  const onboardingGate = resolveOnboardingGate({
    onboardingCompleted: hasCompletedOnboarding,
    phase: onboardingPhase,
    commitmentAccepted: onboardingCommitmentAccepted,
    isAuthenticated,
  });
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
      startupLog('bootstrap.begin');
      try {
        // Load current user first so pet storage keys are correctly namespaced.
        await loadCurrentUser();
        startupLog('bootstrap.auth_loaded');
        await Promise.all([
          loadSettings(),
          loadPets(),
          useOnboardingDraftStore.getState().hydrate(),
        ]);
        startupLog('bootstrap.settings_pets_loaded');
        ensureAuthSessionListenerAttached();
        setBootstrapped(true);
        startupLog('bootstrap.done');
      } catch (error) {
        startupError('bootstrap', error);
        throw error;
      }
    };

    bootstrap();
  }, [loadCurrentUser, loadSettings, loadPets]);

  useEffect(() => {
    if (!bootstrapped || !isAuthenticated) {
      return;
    }
    const { phase, commitmentAccepted } = useOnboardingDraftStore.getState().draft;
    if (commitmentAccepted && phase === 'quiz') {
      setOnboardingPhase('paywall');
    }
  }, [bootstrapped, isAuthenticated, setOnboardingPhase]);

  useEffect(() => {
    if (!bootstrapped) {
      return;
    }
    registerCrashlyticsUserSync();
    startupLog('post_bootstrap.notifications.begin');
    void bootstrapLocalNotifications()
      .then(() => startupLog('post_bootstrap.notifications.done'))
      .catch(error => startupError('post_bootstrap.notifications', error));
  }, [bootstrapped]);

  useEffect(() => {
    if (!bootstrapped || !isAuthenticated) {
      return;
    }
    void runBootNotificationResyncIfNeeded();
    void useSmartHealthRecordStore.getState().processPendingSync();
  }, [bootstrapped, isAuthenticated]);

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
          void useSmartHealthRecordStore.getState().processPendingSync();
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
      startupLog('auth_data_sync.begin', `user=${activeUserId}`);
      try {
        if (skipCacheReset) {
          appOrchestrator.refreshHomeDashboardObservation();
          await Promise.all([loadReminders(), loadRecords()]);
          if (authDataSyncGenerationRef.current !== syncGeneration) {
            startupLog('auth_data_sync.aborted', 'stale_generation_refresh');
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
            startupLog('auth_data_sync.aborted', 'stale_generation_sync');
            return;
          }
        }
        startupLog('auth_data_sync.done');
        scheduleDeferredNotificationResync();
      } catch (error) {
        startupError('auth_data_sync', error);
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

  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (user?.id) {
      posthog.identify(user.id, {
        $set: {
          email: user.email ?? undefined,
          display_name: user.displayName ?? undefined,
        },
      });
    } else if (userId === null || userId === undefined) {
      posthog.reset();
    }
  }, [user, userId]);

  if (!bootstrapped) {
    return <SplashScreen />;
  }

  let content: React.ReactElement = <AuthNavigator />;
  if (onboardingGate === 'quiz' || onboardingGate === 'paywall' || onboardingGate === 'tips') {
    content = <OnboardingNavigator />;
  } else if (onboardingGate === 'auth') {
    content = <AuthNavigator />;
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
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
        void flushInitialNotificationNavigation(navigationRef, () =>
          canNavigateNotificationRef.current,
        );
      }}
      onStateChange={() => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
        if (previousRouteName !== currentRouteName && currentRouteName) {
          posthog.screen(currentRouteName, { previous_screen: previousRouteName });
        }
        routeNameRef.current = currentRouteName;
      }}
    >
      <PostHogProvider
        client={posthog}
        autocapture={{
          captureScreens: false,
          captureTouches: true,
          propsToCapture: ['testID'],
        }}
      >
        <>
          {content}
          <MilestoneCelebrationsHost />
        </>
      </PostHogProvider>
    </NavigationContainer>
  );
};

export default RootNavigator;
