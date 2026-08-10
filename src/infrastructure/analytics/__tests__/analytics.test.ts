jest.mock('../../../config/posthog', () => ({
  posthog: {
    capture: jest.fn(),
    screen: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
  },
}));

jest.mock('@react-native-firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({})),
  logEvent: jest.fn(async () => undefined),
  logScreenView: jest.fn(async () => undefined),
  setAnalyticsCollectionEnabled: jest.fn(async () => undefined),
  setUserId: jest.fn(async () => undefined),
}));

import { createAnalytics } from '../analytics';
import type { FirebaseAnalyticsPort } from '../types';

function createMockFirebase(): FirebaseAnalyticsPort {
  return {
    setCollectionEnabled: jest.fn(
      async (_enabled: boolean): Promise<void> => undefined,
    ),
    logEvent: jest.fn(
      async (_name: string, _params?: unknown): Promise<void> => undefined,
    ),
    logScreenView: jest.fn(
      async (_params: {
        screen_name: string;
        screen_class: string;
      }): Promise<void> => undefined,
    ),
    setUserId: jest.fn(async (_userId: string): Promise<void> => undefined),
  };
}

function createMockPostHog() {
  return {
    capture: jest.fn(),
    screen: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
  };
}

describe('createAnalytics', () => {
  it('disables Firebase collection in dev on init', async () => {
    const firebase = createMockFirebase();
    const posthog = createMockPostHog();
    const analytics = createAnalytics({
      posthog,
      firebase,
      isDev: true,
    });

    await analytics.initAnalytics();

    expect(firebase.setCollectionEnabled).toHaveBeenCalledWith(false);
  });

  it('enables Firebase collection when not in dev', async () => {
    const firebase = createMockFirebase();
    const posthog = createMockPostHog();
    const analytics = createAnalytics({
      posthog,
      firebase,
      isDev: false,
    });

    await analytics.initAnalytics();

    expect(firebase.setCollectionEnabled).toHaveBeenCalledWith(true);
  });

  it('fans trackEvent out to PostHog and Firebase', async () => {
    const firebase = createMockFirebase();
    const posthog = createMockPostHog();
    const analytics = createAnalytics({
      posthog,
      firebase,
      isDev: false,
    });

    await analytics.trackEvent('user_logged_in', { method: 'email' });

    expect(posthog.capture).toHaveBeenCalledWith('user_logged_in', {
      method: 'email',
    });
    expect(firebase.logEvent).toHaveBeenCalledWith('user_logged_in', {
      method: 'email',
    });
  });

  it('fans trackScreen out to PostHog and Firebase', async () => {
    const firebase = createMockFirebase();
    const posthog = createMockPostHog();
    const analytics = createAnalytics({
      posthog,
      firebase,
      isDev: false,
    });

    await analytics.trackScreen('Home', { previous_screen: 'Login' });

    expect(posthog.screen).toHaveBeenCalledWith('Home', {
      previous_screen: 'Login',
    });
    expect(firebase.logScreenView).toHaveBeenCalledWith({
      screen_name: 'Home',
      screen_class: 'Home',
    });
  });

  it('identifyUser sets PostHog traits and Firebase user id', async () => {
    const firebase = createMockFirebase();
    const posthog = createMockPostHog();
    const analytics = createAnalytics({
      posthog,
      firebase,
      isDev: false,
    });

    await analytics.identifyUser('uid-1', {
      email: 'a@b.com',
      displayName: 'Ada',
    });

    expect(posthog.identify).toHaveBeenCalledWith('uid-1', {
      $set: {
        email: 'a@b.com',
        display_name: 'Ada',
      },
    });
    expect(firebase.setUserId).toHaveBeenCalledWith('uid-1');
    expect(firebase.logEvent).not.toHaveBeenCalled();
  });

  it('resetUser resets PostHog and clears Firebase user id', async () => {
    const firebase = createMockFirebase();
    const posthog = createMockPostHog();
    const analytics = createAnalytics({
      posthog,
      firebase,
      isDev: false,
    });

    await analytics.resetUser();

    expect(posthog.reset).toHaveBeenCalled();
    expect(firebase.setUserId).toHaveBeenCalledWith('');
  });

  it('swallows Firebase errors so callers are not rejected', async () => {
    const firebase = createMockFirebase();
    (firebase.logEvent as jest.Mock).mockRejectedValueOnce(
      new Error('native boom'),
    );
    const posthog = createMockPostHog();
    const analytics = createAnalytics({
      posthog,
      firebase,
      isDev: false,
    });

    await expect(
      analytics.trackEvent('reminder_created', { has_notes: true }),
    ).resolves.toBeUndefined();
    expect(posthog.capture).toHaveBeenCalled();
  });
});
