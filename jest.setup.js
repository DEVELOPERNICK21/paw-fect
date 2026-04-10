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
      onBackgroundEvent: jest.fn(() => noop),
      onForegroundEvent: jest.fn(() => noop),
      getInitialNotification: jest.fn(async () => null),
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
