import { notificationService } from '../../infrastructure/notifications/notificationService';
import { ensureNotificationsReady } from '../../infrastructure/notifications/notificationDiagnostics';
import {
  cancelReminderNotifications,
  syncAllReminderNotifications,
  syncReminderNotifications,
  type ReminderScheduleInput,
} from '../../infrastructure/notifications/reminderSchedule';
import { createReminderRepository } from './data/repositories/ReminderRepositoryImpl';
import type { Reminder } from './domain/models/Reminder';
import { CreateReminder } from './domain/usecases/CreateReminder';
import { CreateReminderEntry } from './domain/usecases/CreateReminderEntry';
import { DeleteReminder } from './domain/usecases/DeleteReminder';
import { GetReminders } from './domain/usecases/GetReminders';
import { UpdateReminder } from './domain/usecases/UpdateReminder';

const repository = createReminderRepository();

function toReminderScheduleInput(r: Reminder): ReminderScheduleInput {
  return {
    id: r.id,
    petId: r.petId,
    title: r.title,
    date: r.date,
    time: r.time,
  };
}

export const remindersComposition = {
  getReminders: new GetReminders(repository),
  createReminder: new CreateReminder(repository),
  updateReminder: new UpdateReminder(repository),
  deleteReminder: new DeleteReminder(repository),
  createReminderEntry: new CreateReminderEntry(),
  scheduleReminderNotifications: async (r: Reminder): Promise<number> => {
    const granted = await ensureNotificationsReady();
    if (!granted) {
      return 0;
    }
    return syncReminderNotifications(toReminderScheduleInput(r), notificationService);
  },
  cancelReminderNotifications: async (reminderId: string): Promise<void> => {
    await cancelReminderNotifications(reminderId, notificationService);
  },
  syncAllReminderNotifications: async (reminders: Reminder[]): Promise<void> => {
    const granted = await ensureNotificationsReady();
    if (!granted) {
      return;
    }
    await syncAllReminderNotifications(
      reminders.map(toReminderScheduleInput),
      notificationService,
    );
  },
} as const;
