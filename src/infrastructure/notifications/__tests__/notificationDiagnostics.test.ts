import notifee from '@notifee/react-native';
import { Platform } from 'react-native';

jest.mock('../notificationService', () => ({
  notificationService: {
    scheduleNotification: jest.fn(),
  },
}));

jest.mock('../../logging/startupLog', () => ({
  startupLog: jest.fn(),
  startupError: jest.fn(),
}));

import { ensureNotificationsReady, resetNotificationDiagnosticsStateForTests } from '../notificationDiagnostics';
import { resetNotificationChannelStateForTests } from '../notificationChannels';

describe('ensureNotificationsReady', () => {
  beforeEach(() => {
    resetNotificationDiagnosticsStateForTests();
    resetNotificationChannelStateForTests();
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
  });

  it('allows normal scheduling when Android exact alarms are disabled', async () => {
    (notifee.getNotificationSettings as jest.Mock).mockResolvedValueOnce({
      authorizationStatus: 1,
      android: { alarm: 0 },
    });

    await expect(ensureNotificationsReady()).resolves.toBe(true);
    expect(notifee.openAlarmPermissionSettings).not.toHaveBeenCalled();
  });
});
