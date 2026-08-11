import { notificationService } from '../../infrastructure/notifications/notificationService';
import {
  cancelReminderNotifications,
  reminderNotificationIds,
} from '../../infrastructure/notifications/reminderSchedule';
import { requestNotificationResync } from '../../infrastructure/notifications/requestNotificationResync';
import { isFutureReminderDateTime } from '../../shared/utils/reminderDateTime';
import type { Reminder } from './domain/models/Reminder';
import { createReminderRepository } from './data/repositories/ReminderRepositoryImpl';
import { CreateReminder } from './domain/usecases/CreateReminder';
import { CreateReminderEntry } from './domain/usecases/CreateReminderEntry';
import { DeleteReminder } from './domain/usecases/DeleteReminder';
import { GetReminders } from './domain/usecases/GetReminders';
import { UpdateReminder } from './domain/usecases/UpdateReminder';

const repository = createReminderRepository();

const REMINDER_NOTIFICATIONS_BLOCKED_MESSAGE =
  'Notifications are off or blocked. Turn on alerts in Settings and allow Pawsoul in system settings.';

async function verifyReminderNotificationsScheduled(reminder: Reminder): Promise<void> {
  if (!isFutureReminderDateTime(reminder.date, reminder.time)) {
    return;
  }
  const expectedIds = reminderNotificationIds(reminder.id);
  const pendingIds = await notificationService.getTriggerNotificationIds();
  const hasScheduledLead = expectedIds.some(id => pendingIds.includes(id));
  if (!hasScheduledLead) {
    throw new Error(REMINDER_NOTIFICATIONS_BLOCKED_MESSAGE);
  }
}

export const remindersComposition = {
  getReminders: new GetReminders(repository),
  createReminder: new CreateReminder(repository),
  updateReminder: new UpdateReminder(repository),
  deleteReminder: new DeleteReminder(repository),
  createReminderEntry: new CreateReminderEntry(),
  cancelReminderNotifications: async (reminderId: string): Promise<void> => {
    await cancelReminderNotifications(reminderId, notificationService);
  },
  resyncMustFireNotifications: async (): Promise<void> => {
    await requestNotificationResync();
  },
  verifyReminderNotificationsScheduled,
} as const;
