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
import {
  identifyUser,
  initAnalytics,
  resetUser,
  trackScreen,
} from '../../infrastructure/analytics/analytics';
import { registerCrashlyticsUserSync } from '../../infrastructure/crashlytics/registerCrashlyticsUserSync';
import {
  configureRevenueCat,
  loginRevenueCatUser,
  logoutRevenueCatUser,
} from '../../infrastructure/purchases/revenueCatClient';
import '../../modules/app/application/registerAppSessionPortSync';
import { appOrchestrator } from '../../modules/app/appComposition';
import { registerNotificationFeedSync } from '../../modules/notifications/bootstrap/registerNotificationFeedSync';
import { useHomeQuickActionsUsageStore } from '../../modules/app/store/homeQuickActionsUsageStore';
import { useOnboardingDraftStore } from '../../modules/app/store/onboardingDraftStore';
import {
  isFirstWinPersisted,
  resolveOnboardingGate,
} from '../../modules/app/domain/onboarding/resolveOnboardingGate';
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
import { withTimeout } from '../../shared/utils/withTimeout';

/** Leave splash even if pets/settings are still catching up. */
const BOOTSTRAP_PETS_WAIT_MS = 6_000;
const BOOTSTRAP_SETTINGS_WAIT_MS = 8_000;
/** Never keep the sign-in pets splash longer than this. */
const SIGN_IN_PETS_SPLASH_MAX_MS = 8_000;
const AUTH_DATA_SYNC_TIMEOUT_MS = 15_000;

export const RootNavigator: React.FC = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isSessionReady = useAuthStore(state => state.isSessionReady);
  const loadCurrentUser = useAuthStore(state => state.loadCurrentUser);
  const refreshProfile = useAuthStore(state => state.refreshProfile);
  const processPasswordResetQueue = useAuthStore(
    state => state.processPasswordResetQueue,
  );
  const userId = useAuthStore(state => state.user?.id);
  const settings = useSettingsStore(state => state.settings);
  const loadSettings = useSettingsStore(state => state.loadSettings);
  const onboardingDraft = useOnboardingDraftStore(state => state.draft);
  const onboardingPhase = onboardingDraft.phase;
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
  const [signInPetsSplashTimedOut, setSignInPetsSplashTimedOut] =
    useState(false);
  const lastSyncedUserIdRef = useRef<string | null>(null);
  const routeNameRef = useRef<string | undefined>(undefined);
  const authDataSyncGenerationRef = useRef(0);
  const appStateResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const hasCompletedOnboarding = settings?.onboardingCompleted ?? false;
  const onboardingGate = resolveOnboardingGate({
    onboardingCompleted: hasCompletedOnboarding,
    phase: onboardingPhase,
    entryIntent: onboardingDraft.entryIntent,
    isAuthenticated,
    hasPets: pets.length > 0,
    petsLoading,
    activationSubmitted: onboardingDraft.activationSubmitted,
    firstWinPersisted: isFirstWinPersisted(onboardingDraft),
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
    let cancelled = false;

    const bootstrap = async () => {
      startupLog('bootstrap.begin');
      try {
        // Restore session first so pet storage keys are correctly namespaced.
        try {
          await loadCurrentUser();
          startupLog('bootstrap.auth_loaded');
        } catch (error) {
          startupError('bootstrap.auth', error);
        }

        await Promise.all([
          withTimeout(
            loadSettings(),
            BOOTSTRAP_SETTINGS_WAIT_MS,
            'Settings load timed out.',
          ).catch(error => {
            startupError('bootstrap.settings', error);
          }),
          useOnboardingDraftStore.getState().hydrate(),
          // Cap pet wait so a hung Firestore read cannot pin Splash forever.
          withTimeout(
            loadPets(),
            BOOTSTRAP_PETS_WAIT_MS,
            'Bootstrap pets timed out.',
          ).catch(error => {
            startupLog(
              'bootstrap.pets_deferred',
              error instanceof Error ? error.message : 'pets deferred',
            );
            // Underlying loadPets may still finish; ensure loading cannot stick.
            if (usePetStore.getState().loading) {
              // Keep loading true only briefly — store timeout will clear it.
              // If no user yet, clear immediately.
              if (!useAuthStore.getState().user?.id) {
                usePetStore.setState({ loading: false });
              }
            }
          }),
        ]);
        startupLog('bootstrap.settings_pets_loaded');
      } catch (error) {
        startupError('bootstrap', error);
      } finally {
        if (!cancelled) {
          ensureAuthSessionListenerAttached();
          setBootstrapped(true);
          startupLog('bootstrap.done');
        }
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [loadCurrentUser, loadSettings, loadPets]);

  useEffect(() => {
    if (!bootstrapped) {
      return;
    }
    registerCrashlyticsUserSync();
    void initAnalytics();
    configureRevenueCat();
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
          void loadPets().catch(() => {});
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
    loadPets,
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
      void logoutRevenueCatUser().catch(() => {});
      return undefined;
    }

    subscriptionApi.startListening(userId);
    void subscriptionApi.refreshBootstrap();
    void loginRevenueCatUser(userId).catch(() => {});

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
    // Only skip a full pet reload when this user already has pets in memory.
    // Do NOT treat `loading` as skip-worthy: logout/reset leave loading=true with
    // an empty list, and a re-entry would otherwise never call loadPets (splash stuck).
    const skipCacheReset =
      !userChanged && bootstrapped && petState.pets.length > 0;

    const syncGeneration = authDataSyncGenerationRef.current + 1;
    authDataSyncGenerationRef.current = syncGeneration;

    // Mark pets loading synchronously before the async sync so sign-in
    // does not treat a pre-auth empty cache as "account has no pets".
    if (!skipCacheReset) {
      resetPets();
    }

    void (async () => {
      startupLog('auth_data_sync.begin', `user=${activeUserId}`);
      try {
        if (skipCacheReset) {
          appOrchestrator.refreshHomeDashboardObservation();
          await withTimeout(
            Promise.all([loadReminders(), loadRecords()]),
            AUTH_DATA_SYNC_TIMEOUT_MS,
            'Auth data refresh timed out.',
          );
          if (authDataSyncGenerationRef.current !== syncGeneration) {
            startupLog('auth_data_sync.aborted', 'stale_generation_refresh');
            return;
          }
        } else {
          await withTimeout(
            appOrchestrator.syncAuthenticatedDataStores(
              {
                resetPets,
                resetReminders,
                resetRecords,
                loadPets,
                loadReminders,
                loadRecords,
              },
              { resetCaches: true },
            ),
            AUTH_DATA_SYNC_TIMEOUT_MS,
            'Auth data sync timed out.',
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
        // Never leave the shell blocked on Splash (pets.loading === true).
        if (usePetStore.getState().loading) {
          usePetStore.setState({ loading: false });
        }
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

  useEffect(() => {
    if (!bootstrapped || !isAuthenticated || petsLoading) {
      return;
    }
    if (onboardingDraft.entryIntent !== 'sign_in') {
      return;
    }
    const store = useOnboardingDraftStore.getState();
    if (hasCompletedOnboarding || pets.length > 0) {
      store.clearEntryIntent();
      if (pets.length > 0 && !hasCompletedOnboarding) {
        // Existing account with pets: drop any leftover onboarding draft.
        void store.clear();
      }
      return;
    }
    store.clearEntryIntent();
    store.startActivation();
  }, [
    bootstrapped,
    isAuthenticated,
    petsLoading,
    pets.length,
    hasCompletedOnboarding,
    onboardingDraft.entryIntent,
  ]);

  // Recover if activation was started from sign-in before pets finished syncing.
  useEffect(() => {
    if (!bootstrapped || !isAuthenticated || petsLoading || pets.length === 0) {
      return;
    }
    const { draft, clear } = useOnboardingDraftStore.getState();
    if (draft.activationSubmitted) {
      return;
    }
    if (draft.phase !== 'activate' && draft.entryIntent !== 'sign_in') {
      return;
    }
    void clear();
  }, [bootstrapped, isAuthenticated, petsLoading, pets.length]);

  // Gate can resolve to persist while draft.phase still reads activate after auth
  // (submitActivation while unauthenticated). Keep navigator phase aligned with gate.
  useEffect(() => {
    if (!bootstrapped || onboardingGate !== 'persist') {
      return;
    }
    if (onboardingPhase === 'persist') {
      return;
    }
    useOnboardingDraftStore.getState().setPhase('persist');
  }, [bootstrapped, onboardingGate, onboardingPhase]);

  // Cap "Fetching your pet's world" after sign-in so a hung load cannot trap the user.
  useEffect(() => {
    const pending =
      bootstrapped &&
      isAuthenticated &&
      petsLoading &&
      onboardingDraft.entryIntent === 'sign_in' &&
      !hasCompletedOnboarding;
    if (!pending) {
      setSignInPetsSplashTimedOut(false);
      return undefined;
    }
    const timeoutId = setTimeout(() => {
      setSignInPetsSplashTimedOut(true);
      if (usePetStore.getState().loading) {
        usePetStore.setState({ loading: false });
      }
      startupLog('sign_in_pets_splash.timeout');
    }, SIGN_IN_PETS_SPLASH_MAX_MS);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    bootstrapped,
    isAuthenticated,
    petsLoading,
    onboardingDraft.entryIntent,
    hasCompletedOnboarding,
  ]);

  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (user?.id) {
      void identifyUser(user.id, {
        email: user.email ?? undefined,
        displayName: user.displayName ?? undefined,
      });
    } else if (userId === null || userId === undefined) {
      void resetUser();
    }
  }, [user, userId]);

  if (!bootstrapped) {
    return <SplashScreen />;
  }

  const signInPetsPending =
    isAuthenticated &&
    petsLoading &&
    onboardingDraft.entryIntent === 'sign_in' &&
    !hasCompletedOnboarding &&
    !signInPetsSplashTimedOut;

  if (signInPetsPending) {
    return <SplashScreen />;
  }

  let content: React.ReactElement = <AuthNavigator />;
  if (
    onboardingGate === 'welcome' ||
    onboardingGate === 'activate' ||
    onboardingGate === 'persist' ||
    onboardingGate === 'paywall'
  ) {
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
          void trackScreen(
            currentRouteName,
            previousRouteName
              ? { previous_screen: previousRouteName }
              : undefined,
          );
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
