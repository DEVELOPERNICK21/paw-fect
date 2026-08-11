import notifee from '@notifee/react-native';
import { Platform } from 'react-native';

jest.mock('../../../modules/settings/store/settingsStore', () => ({
  useSettingsStore: {
    getState: () => ({
      settings: { notificationsEnabled: true },
    }),
  },
}));

jest.mock('../../logging/startupLog', () => ({
  startupLog: jest.fn(),
}));

import { NotifeeNotificationService } from '../notifeeNotificationService';

describe('NotifeeNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
  });

  it('falls back to a non-exact Android trigger when exact alarms are disabled', async () => {
    (notifee.getNotificationSettings as jest.Mock).mockResolvedValueOnce({
      authorizationStatus: 1,
      android: { alarm: 0 },
    });

    const service = new NotifeeNotificationService();
    await service.scheduleNotification({
      id: 'test-id',
      title: 'Test',
      body: 'Body',
      scheduledDate: new Date(Date.now() + 60_000),
    });

    const trigger = (notifee.createTriggerNotification as jest.Mock).mock
      .calls[0]?.[1];
    expect(trigger?.alarmManager).toBeUndefined();
  });

  it('uses dog notification sound when petSpecies is dog', async () => {
    (notifee.getNotificationSettings as jest.Mock).mockResolvedValueOnce({
      authorizationStatus: 1,
      android: { alarm: 1 },
    });

    const service = new NotifeeNotificationService();
    await service.scheduleNotification({
      id: 'dog-reminder',
      title: 'Walk',
      body: 'Time to walk',
      scheduledDate: new Date(Date.now() + 60_000),
      data: {
        kind: 'reminder',
        reminderId: 'r1',
        petSpecies: 'dog',
        soundProfile: 'dog_active_urgent',
      },
    });

    const request = (notifee.createTriggerNotification as jest.Mock).mock
      .calls[0]?.[0];
    expect(request?.android?.sound).toBe('dog_active_urgent');
    expect(request?.ios?.sound).toBe('dog_active_urgent.wav');
    expect(request?.android?.channelId).toBe('pawfect-dog_active_urgent');
  });

  it('lists trigger notification ids from notifee', async () => {
    (notifee.getTriggerNotifications as jest.Mock).mockResolvedValueOnce([
      { notification: { id: 'reminder-1-due' } },
    ]);

    const service = new NotifeeNotificationService();
    const ids = await service.getTriggerNotificationIds();

    expect(ids).toEqual(['reminder-1-due']);
  });
});
