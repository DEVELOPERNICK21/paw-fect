import { createPetLocalDataSource } from '../../modules/pets/data/datasources/PetLocalDataSource';
import { createReminderLocalDataSource } from '../../modules/reminders/data/datasources/ReminderLocalDataSource';
import { createSmartHealthLocalDataSource } from '../../modules/records/data/datasources/SmartHealthLocalDataSource';
import type { Reminder } from '../../modules/reminders/domain/models/Reminder';
import { scheduleComposition } from '../../modules/schedule/scheduleComposition';
import { normalizeStoredUser } from '../../modules/auth/domain/models/normalizeStoredUser';
import { storageService } from '../storage/storageService';
import { getTodayIsoDateLocal } from '../../shared/utils/calendarDate';
import { applyMustFireNotificationPlan } from './applyMustFireNotificationPlan';
import {
  ensureNotificationsReady,
  type EnsureNotificationsReadyOptions,
} from './notificationDiagnostics';
import type { ReminderScheduleInput } from './reminderSchedule';
import type { PetNotificationSpecies } from './petNotificationSounds';

const AUTH_USER_KEY = 'authUser';

async function readPersistedUserId(): Promise<string | null> {
  const raw = await storageService.getItem<unknown>(AUTH_USER_KEY);
  const user = normalizeStoredUser(raw);
  return user?.id ?? null;
}

function toReminderScheduleInputs(
  reminders: Reminder[],
  petSpeciesByPetId: ReadonlyMap<string, PetNotificationSpecies>,
): ReminderScheduleInput[] {
  return reminders.map(reminder => ({
    id: reminder.id,
    petId: reminder.petId,
    title: reminder.title,
    date: reminder.date,
    time: reminder.time,
    petSpecies: petSpeciesByPetId.get(reminder.petId),
  }));
}

/**
 * Rebuilds local notifications from persisted auth/pets/reminders without Zustand stores.
 * Used after device boot before stores hydrate.
 */
export async function resyncLocalNotificationsFromStorage(
  options?: EnsureNotificationsReadyOptions,
): Promise<boolean> {
  const granted = await ensureNotificationsReady(options);
  if (!granted) {
    return false;
  }

  const userId = await readPersistedUserId();
  if (userId == null) {
    return false;
  }

  const petLocal = createPetLocalDataSource();
  const reminderLocal = createReminderLocalDataSource();
  const smartHealthLocal = createSmartHealthLocalDataSource();
  const pets = await petLocal.getPets(userId);
  const reminders = await reminderLocal.getReminders();
  const activePetId = (await petLocal.getActivePetId(userId)) ?? pets[0]?.id ?? null;
  const petSpeciesByPetId = new Map(pets.map(pet => [pet.id, pet.type] as const));
  const today = getTodayIsoDateLocal();

  const healthRecords = (
    await Promise.all(
      pets.map(pet => smartHealthLocal.getRecords(userId, pet.id)),
    )
  ).flat();

  const schedules = (
    await Promise.all(
      pets.map(async pet => {
        const schedule = await scheduleComposition.buildDailySchedule.execute({
          userId,
          petId: pet.id,
          date: today,
        });
        if (schedule == null) {
          return null;
        }
        return {
          schedule,
          blocks: schedule.blocks,
          petSpecies: pet.type,
        };
      }),
    )
  ).filter((entry): entry is NonNullable<typeof entry> => entry != null);

  await applyMustFireNotificationPlan({
    reminders: toReminderScheduleInputs(reminders, petSpeciesByPetId),
    healthRecords,
    schedules,
    petSpeciesByPetId,
    activePetId,
  });

  return true;
}
