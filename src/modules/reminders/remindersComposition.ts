import { notificationService } from '../../infrastructure/notifications/notificationService';
import { ensureNotificationsReady } from '../../infrastructure/notifications/notificationDiagnostics';
import {
  cancelReminderNotifications,
  syncAllReminderNotifications,
  syncReminderNotifications,
  type ReminderScheduleInput,
} from '../../infrastructure/notifications/reminderSchedule';
import { getAppSessionUserId } from '../../shared/session/appSessionPorts';
import { createPetRepository } from '../pets/data/repositories/PetRepositoryImpl';
import { createReminderRepository } from './data/repositories/ReminderRepositoryImpl';
import type { Reminder } from './domain/models/Reminder';
import { CreateReminder } from './domain/usecases/CreateReminder';
import { CreateReminderEntry } from './domain/usecases/CreateReminderEntry';
import { DeleteReminder } from './domain/usecases/DeleteReminder';
import { GetReminders } from './domain/usecases/GetReminders';
import { UpdateReminder } from './domain/usecases/UpdateReminder';

const repository = createReminderRepository();
const petRepository = createPetRepository();

function toReminderScheduleInput(r: Reminder): ReminderScheduleInput {
  return {
    id: r.id,
    petId: r.petId,
    title: r.title,
    date: r.date,
    time: r.time,
  };
}

async function toReminderScheduleInputWithSpecies(
  r: Reminder,
): Promise<ReminderScheduleInput> {
  const base = toReminderScheduleInput(r);
  const userId = getAppSessionUserId();
  if (userId == null) {
    return base;
  }
  const pet = await petRepository.getPetById(userId, r.petId);
  if (pet == null) {
    return base;
  }
  return { ...base, petSpecies: pet.type };
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
    return syncReminderNotifications(
      await toReminderScheduleInputWithSpecies(r),
      notificationService,
    );
  },
  cancelReminderNotifications: async (reminderId: string): Promise<void> => {
    await cancelReminderNotifications(reminderId, notificationService);
  },
  syncAllReminderNotifications: async (reminders: Reminder[]): Promise<void> => {
    const granted = await ensureNotificationsReady();
    if (!granted) {
      return;
    }
    const inputs = await Promise.all(
      reminders.map(reminder => toReminderScheduleInputWithSpecies(reminder)),
    );
    await syncAllReminderNotifications(inputs, notificationService);
  },
} as const;
