jest.mock('../../../infrastructure/notifications/requestNotificationResync', () => ({
  requestNotificationResync: jest.fn(async () => {}),
}));

const mockGetTriggerNotificationIds = jest.fn(async () => [] as string[]);

jest.mock('../../../infrastructure/notifications/notificationService', () => ({
  notificationService: {
    getTriggerNotificationIds: () => mockGetTriggerNotificationIds(),
  },
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
    mockGetTriggerNotificationIds.mockResolvedValue([]);
  });

  it('resyncMustFireNotifications delegates to planner resync', async () => {
    await remindersComposition.resyncMustFireNotifications();

    expect(mockRequestNotificationResync).toHaveBeenCalledTimes(1);
  });
});

describe('remindersComposition verifyReminderNotificationsScheduled', () => {
  const futureReminder = {
    id: 'rem-1',
    petId: 'pet-1',
    title: 'Vaccination',
    type: 'vaccination' as const,
    date: '2030-06-15',
    time: '10:00',
    repeat: 'once' as const,
    notes: '',
    notificationId: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTriggerNotificationIds.mockResolvedValue([]);
  });

  it('throws when a future reminder has no scheduled leads after resync', async () => {
    await expect(
      remindersComposition.verifyReminderNotificationsScheduled(futureReminder),
    ).rejects.toThrow(
      'Notifications are off or blocked. Turn on alerts in Settings and allow Pawsoul in system settings.',
    );
  });

  it('passes when at least one reminder lead is pending', async () => {
    mockGetTriggerNotificationIds.mockResolvedValue(['reminder-rem-1-due']);

    await expect(
      remindersComposition.verifyReminderNotificationsScheduled(futureReminder),
    ).resolves.toBeUndefined();
  });

  it('passes when due time is in the past even if no leads are pending', async () => {
    const pastReminder = { ...futureReminder, date: '2020-01-01', time: '10:00' };

    await expect(
      remindersComposition.verifyReminderNotificationsScheduled(pastReminder),
    ).resolves.toBeUndefined();

    expect(mockGetTriggerNotificationIds).not.toHaveBeenCalled();
  });
});
