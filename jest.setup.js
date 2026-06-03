jest.mock('@notifee/react-native', () => {
  const noop = () => {};
  return {
    __esModule: true,
    default: {
      createChannel: jest.fn(async () => {}),
      requestPermission: jest.fn(async () => ({ authorizationStatus: 1 })),
      cancelNotification: jest.fn(async () => {}),
      cancelAllNotifications: jest.fn(async () => {}),
      createTriggerNotification: jest.fn(async () => {}),
      displayNotification: jest.fn(async () => 'mock-id'),
      getTriggerNotifications: jest.fn(async () => []),
      getNotificationSettings: jest.fn(async () => ({
        authorizationStatus: 1,
        android: { alarm: 1 },
      })),
      openAlarmPermissionSettings: jest.fn(async () => {}),
      onBackgroundEvent: jest.fn(() => noop),
      setNotificationCategories: jest.fn(() => Promise.resolve()),
      onForegroundEvent: jest.fn(() => noop),
      getInitialNotification: jest.fn(async () => null),
    },
    AndroidNotificationSetting: { NOT_SUPPORTED: -1, DISABLED: 0, ENABLED: 1 },
    AuthorizationStatus: {
      NOT_DETERMINED: -1,
      DENIED: 0,
      AUTHORIZED: 1,
      PROVISIONAL: 2,
    },
    AndroidImportance: { DEFAULT: 3, HIGH: 4 },
    TriggerType: { TIMESTAMP: 1 },
    RepeatFrequency: { NONE: 0, HOURLY: 1, DAILY: 2, WEEKLY: 3 },
    EventType: {
      UNKNOWN: -1,
      DISMISSED: 0,
      PRESS: 1,
      ACTION_PRESS: 2,
      DELIVERED: 3,
    },
  };
});
