import { posthog } from '../../config/posthog';

import { createFirebaseAnalyticsPort } from './firebaseAnalytics';
import type {
  AnalyticsDeps,
  AnalyticsFacade,
  AnalyticsParams,
  IdentifyTraits,
  PostHogAnalyticsClient,
} from './types';

export function createAnalytics(deps: AnalyticsDeps): AnalyticsFacade {
  const { posthog: ph, firebase, isDev } = deps;

  const initAnalytics = async (): Promise<void> => {
    try {
      await firebase.setCollectionEnabled(!isDev);
    } catch {
      /* Firebase must not tear down UI */
    }
  };

  const trackEvent = async (
    name: string,
    params?: AnalyticsParams,
  ): Promise<void> => {
    try {
      ph.capture(name, params);
    } catch {
      /* PostHog must not tear down UI */
    }
    try {
      await firebase.logEvent(name, params);
    } catch {
      /* Firebase must not tear down UI */
    }
  };

  const trackScreen = async (
    screenName: string,
    params?: AnalyticsParams,
  ): Promise<void> => {
    try {
      ph.screen(screenName, params);
    } catch {
      /* PostHog must not tear down UI */
    }
    try {
      await firebase.logScreenView({
        screen_name: screenName,
        screen_class: screenName,
      });
    } catch {
      /* Firebase must not tear down UI */
    }
  };

  const identifyUser = async (
    userId: string,
    traits?: IdentifyTraits,
  ): Promise<void> => {
    try {
      ph.identify(userId, {
        $set: {
          email: traits?.email,
          display_name: traits?.displayName,
        },
      });
    } catch {
      /* PostHog must not tear down UI */
    }
    try {
      await firebase.setUserId(userId);
    } catch {
      /* Firebase must not tear down UI */
    }
  };

  const resetUser = async (): Promise<void> => {
    try {
      ph.reset();
    } catch {
      /* PostHog must not tear down UI */
    }
    try {
      await firebase.setUserId('');
    } catch {
      /* Firebase must not tear down UI */
    }
  };

  return {
    initAnalytics,
    trackEvent,
    trackScreen,
    identifyUser,
    resetUser,
  };
}

const defaultAnalytics = createAnalytics({
  posthog: posthog as unknown as PostHogAnalyticsClient,
  firebase: createFirebaseAnalyticsPort(),
  isDev: __DEV__,
});

export const initAnalytics = defaultAnalytics.initAnalytics;
export const trackEvent = defaultAnalytics.trackEvent;
export const trackScreen = defaultAnalytics.trackScreen;
export const identifyUser = defaultAnalytics.identifyUser;
export const resetUser = defaultAnalytics.resetUser;
