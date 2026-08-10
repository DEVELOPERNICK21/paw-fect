export type AnalyticsParams = Record<string, string | number | boolean>;

export type IdentifyTraits = {
  email?: string;
  displayName?: string;
};

export type PostHogAnalyticsClient = {
  capture: (event: string, properties?: AnalyticsParams) => void;
  screen: (name: string, properties?: AnalyticsParams) => void;
  identify: (
    distinctId: string,
    properties?: { $set?: Record<string, string | undefined> },
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
