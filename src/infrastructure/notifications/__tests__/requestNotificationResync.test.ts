jest.mock('../resyncLocalNotifications', () => ({
  resyncAllLocalNotifications: jest.fn(async () => {}),
}));

import { resyncAllLocalNotifications } from '../resyncLocalNotifications';
import { requestNotificationResync } from '../requestNotificationResync';

const mockResyncAllLocalNotifications = resyncAllLocalNotifications as jest.MockedFunction<
  typeof resyncAllLocalNotifications
>;

describe('requestNotificationResync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates to resyncAllLocalNotifications', async () => {
    await requestNotificationResync();

    expect(mockResyncAllLocalNotifications).toHaveBeenCalledTimes(1);
  });
});
