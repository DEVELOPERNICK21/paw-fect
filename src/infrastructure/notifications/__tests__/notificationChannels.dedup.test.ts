import notifee, { AuthorizationStatus } from '@notifee/react-native';

import {
  requestNotificationPermission,
  resetNotificationChannelStateForTests,
} from '../notificationChannels';

jest.mock('../../logging/startupLog', () => ({
  startupLog: jest.fn(),
}));

describe('requestNotificationPermission', () => {
  beforeEach(() => {
    resetNotificationChannelStateForTests();
    jest.clearAllMocks();
    (notifee.requestPermission as jest.Mock).mockImplementation(
      () =>
        new Promise(resolve => {
          setTimeout(
            () =>
              resolve({
                authorizationStatus: AuthorizationStatus.AUTHORIZED,
              }),
            20,
          );
        }),
    );
  });

  it('deduplicates concurrent permission prompts', async () => {
    const [first, second, third] = await Promise.all([
      requestNotificationPermission(),
      requestNotificationPermission(),
      requestNotificationPermission(),
    ]);

    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(third).toBe(true);
    expect(notifee.requestPermission).toHaveBeenCalledTimes(1);
  });

  it('picks up a grant made in system Settings after an earlier denial', async () => {
    (notifee.requestPermission as jest.Mock).mockResolvedValueOnce({
      authorizationStatus: AuthorizationStatus.DENIED,
    });
    (notifee.getNotificationSettings as jest.Mock)
      .mockResolvedValueOnce({ authorizationStatus: AuthorizationStatus.DENIED })
      .mockResolvedValueOnce({
        authorizationStatus: AuthorizationStatus.AUTHORIZED,
      });

    expect(await requestNotificationPermission()).toBe(false);
    expect(await requestNotificationPermission()).toBe(false);
    expect(await requestNotificationPermission()).toBe(true);
    expect(await requestNotificationPermission()).toBe(true);
    expect(notifee.requestPermission).toHaveBeenCalledTimes(1);
    expect(notifee.getNotificationSettings).toHaveBeenCalledTimes(2);
  });
});
