export type AnalyticsParams = Record<string, string | number | boolean>;

export type IdentifyTraits = {
  email?: string;
  displayName?: string;
};

export type PostHogAnalyticsClient = {
  capture: (
    event: string,
    properties?: AnalyticsParams | Record<string, unknown>,
  ) => void;
  screen: (
    name: string,
    properties?: AnalyticsParams | Record<string, unknown>,
  ) => void | Promise<void>;
  identify: (
    distinctId: string,
    properties?: Record<string, unknown>,
  ) => void;
  reset: () => void;
};

export type FirebaseAnalyticsPort = {
  setCollectionEnabled: (enabled: boolean) => Promise<void>;
  logEvent: (name: string, params?: AnalyticsParams) => Promise<void>;
  logScreenView: (params: {
    screen_name: string;
    screen_class: string;
  }) => Promise<void>;
  setUserId: (userId: string) => Promise<void>;
};

export type AnalyticsDeps = {
  posthog: PostHogAnalyticsClient;
  firebase: FirebaseAnalyticsPort;
  isDev: boolean;
};

export type AnalyticsFacade = {
  initAnalytics: () => Promise<void>;
  trackEvent: (name: string, params?: AnalyticsParams) => Promise<void>;
  trackScreen: (
    screenName: string,
    params?: AnalyticsParams,
  ) => Promise<void>;
  identifyUser: (userId: string, traits?: IdentifyTraits) => Promise<void>;
  resetUser: () => Promise<void>;
};
