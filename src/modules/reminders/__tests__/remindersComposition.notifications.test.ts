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

jest.mock('../../settings/store/settingsStore', () => ({
  useSettingsStore: {
    getState: jest.fn(() => ({
      settings: { notificationsEnabled: true },
    })),
  },
}));

import notifee, { AuthorizationStatus } from '@notifee/react-native';

import { requestNotificationResync } from '../../../infrastructure/notifications/requestNotificationResync';
import { useSettingsStore } from '../../settings/store/settingsStore';
import {
  REMINDER_NOTIFICATIONS_BLOCKED_MESSAGE,
  REMINDER_NOTIFICATIONS_BUDGET_MESSAGE,
  remindersComposition,
} from '../remindersComposition';

const mockRequestNotificationResync = requestNotificationResync as jest.MockedFunction<
  typeof requestNotificationResync
>;

describe('remindersComposition notification sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTriggerNotificationIds.mockResolvedValue([]);
    (notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
      authorizationStatus: AuthorizationStatus.AUTHORIZED,
    });
    (useSettingsStore.getState as jest.Mock).mockReturnValue({
      settings: { notificationsEnabled: true },
    });
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
    (notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
      authorizationStatus: AuthorizationStatus.AUTHORIZED,
    });
    (useSettingsStore.getState as jest.Mock).mockReturnValue({
      settings: { notificationsEnabled: true },
    });
  });

  it('throws budget message when permission is ok but no leads are pending', async () => {
    await expect(
      remindersComposition.verifyReminderNotificationsScheduled(futureReminder),
    ).rejects.toThrow(REMINDER_NOTIFICATIONS_BUDGET_MESSAGE);
  });

  it('throws blocked message when notifications are disabled in settings', async () => {
    (useSettingsStore.getState as jest.Mock).mockReturnValue({
      settings: { notificationsEnabled: false },
    });

    await expect(
      remindersComposition.verifyReminderNotificationsScheduled(futureReminder),
    ).rejects.toThrow(REMINDER_NOTIFICATIONS_BLOCKED_MESSAGE);
  });

  it('throws blocked message when system notification permission is denied', async () => {
    (notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
      authorizationStatus: AuthorizationStatus.DENIED,
    });

    await expect(
      remindersComposition.verifyReminderNotificationsScheduled(futureReminder),
    ).rejects.toThrow(REMINDER_NOTIFICATIONS_BLOCKED_MESSAGE);
  });

  it('passes when at least one reminder lead is pending', async () => {
    mockGetTriggerNotificationIds.mockResolvedValue(['reminder-rem-1-due']);

    await expect(
      remindersComposition.verifyReminderNotificationsScheduled(futureReminder),
    ).resolves.toBeUndefined();

    expect(notifee.getNotificationSettings).not.toHaveBeenCalled();
  });

  it('passes when due time is in the past even if no leads are pending', async () => {
    const pastReminder = { ...futureReminder, date: '2020-01-01', time: '10:00' };

    await expect(
      remindersComposition.verifyReminderNotificationsScheduled(pastReminder),
    ).resolves.toBeUndefined();

    expect(mockGetTriggerNotificationIds).not.toHaveBeenCalled();
  });
});
