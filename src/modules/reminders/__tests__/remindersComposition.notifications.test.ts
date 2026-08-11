jest.mock('../../../infrastructure/notifications/requestNotificationResync', () => ({
  requestNotificationResync: jest.fn(async () => {}),
}));

jest.mock('../../../infrastructure/notifications/notificationService', () => ({
  notificationService: {},
}));

jest.mock('../data/repositories/ReminderRepositoryImpl', () => ({
  createReminderRepository: () => ({}),
}));

import { requestNotificationResync } from '../../../infrastructure/notifications/requestNotificationResync';
import { remindersComposition } from '../remindersComposition';

const mockRequestNotificationResync = requestNotificationResync as jest.MockedFunction<
  typeof requestNotificationResync
>;

describe('remindersComposition notification sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resyncMustFireNotifications delegates to planner resync', async () => {
    await remindersComposition.resyncMustFireNotifications();

    expect(mockRequestNotificationResync).toHaveBeenCalledTimes(1);
  });
});
