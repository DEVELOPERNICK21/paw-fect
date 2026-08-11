jest.mock('../../../infrastructure/notifications/requestNotificationResync', () => ({
  requestNotificationResync: jest.fn(async () => {}),
}));

jest.mock('../../../infrastructure/notifications/notificationService', () => ({
  notificationService: {},
}));

jest.mock('../data/repositories/HealthRecordRepositoryImpl', () => ({
  createHealthRecordRepository: () => ({}),
}));

jest.mock('../data/repositories/SmartHealthRecordRepositoryImpl', () => ({
  createSmartHealthRecordRepository: () => ({}),
  configureSmartHealthQueueHooks: jest.fn(),
}));

import { requestNotificationResync } from '../../../infrastructure/notifications/requestNotificationResync';
import { recordsComposition } from '../recordsComposition';

const mockRequestNotificationResync = requestNotificationResync as jest.MockedFunction<
  typeof requestNotificationResync
>;

describe('recordsComposition notification sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('syncSmartHealthNotificationsForRecords delegates to planner resync', async () => {
    await recordsComposition.syncSmartHealthNotificationsForRecords([]);

    expect(mockRequestNotificationResync).toHaveBeenCalledTimes(1);
  });

  it('syncDueNotificationsForPets delegates to planner resync', async () => {
    await recordsComposition.syncDueNotificationsForPets('user-1', ['pet-1']);

    expect(mockRequestNotificationResync).toHaveBeenCalledTimes(1);
  });
});
