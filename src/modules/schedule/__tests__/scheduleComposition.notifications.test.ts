jest.mock('../../../infrastructure/notifications/requestNotificationResync', () => ({
  requestNotificationResync: jest.fn(async () => {}),
}));

jest.mock('../../../infrastructure/notifications/notificationService', () => ({
  notificationService: {},
}));

jest.mock('../data/repositories/ScheduleRepositoryImpl', () => ({
  createScheduleRepository: () => ({}),
}));

jest.mock('../../pets/data/repositories/PetRepositoryImpl', () => ({
  createPetRepository: () => ({}),
}));

import { requestNotificationResync } from '../../../infrastructure/notifications/requestNotificationResync';
import { scheduleComposition } from '../scheduleComposition';

const mockRequestNotificationResync = requestNotificationResync as jest.MockedFunction<
  typeof requestNotificationResync
>;

describe('scheduleComposition notification sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resyncMustFireNotifications delegates to planner resync', async () => {
    await scheduleComposition.resyncMustFireNotifications();

    expect(mockRequestNotificationResync).toHaveBeenCalledTimes(1);
  });
});
