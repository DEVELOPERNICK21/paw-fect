import {
  getAnalytics,
  logEvent as firebaseLogEvent,
  logScreenView as firebaseLogScreenView,
  setAnalyticsCollectionEnabled,
  setUserId as firebaseSetUserId,
} from '@react-native-firebase/analytics';

import type { AnalyticsParams, FirebaseAnalyticsPort } from './types';

const logAnalyticsError = (scope: string, error: unknown): void => {
  if (!__DEV__) {
    return;
  }
  console.error(`[analytics] ${scope}`, error);
};

export function createFirebaseAnalyticsPort(): FirebaseAnalyticsPort {
  return {
    setCollectionEnabled: async (enabled: boolean): Promise<void> => {
      try {
        await setAnalyticsCollectionEnabled(getAnalytics(), enabled);
      } catch (error) {
        logAnalyticsError('setCollectionEnabled', error);
      }
    },
    logEvent: async (name: string, params?: AnalyticsParams): Promise<void> => {
      try {
        await firebaseLogEvent(getAnalytics(), name, params);
      } catch (error) {
        logAnalyticsError(`logEvent:${name}`, error);
      }
    },
    logScreenView: async (params: {
      screen_name: string;
      screen_class: string;
    }): Promise<void> => {
      try {
        await firebaseLogScreenView(getAnalytics(), params);
      } catch (error) {
        logAnalyticsError('logScreenView', error);
      }
    },
    setUserId: async (userId: string): Promise<void> => {
      try {
        await firebaseSetUserId(getAnalytics(), userId);
      } catch (error) {
        logAnalyticsError('setUserId', error);
      }
    },
  };
}
