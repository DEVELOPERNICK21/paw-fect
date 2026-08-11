import { notificationService } from '../../infrastructure/notifications/notificationService';
import { cancelReminderNotifications } from '../../infrastructure/notifications/reminderSchedule';
import { requestNotificationResync } from '../../infrastructure/notifications/requestNotificationResync';
import { createReminderRepository } from './data/repositories/ReminderRepositoryImpl';
import { CreateReminder } from './domain/usecases/CreateReminder';
import { CreateReminderEntry } from './domain/usecases/CreateReminderEntry';
import { DeleteReminder } from './domain/usecases/DeleteReminder';
import { GetReminders } from './domain/usecases/GetReminders';
import { UpdateReminder } from './domain/usecases/UpdateReminder';

const repository = createReminderRepository();

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
} as const;
