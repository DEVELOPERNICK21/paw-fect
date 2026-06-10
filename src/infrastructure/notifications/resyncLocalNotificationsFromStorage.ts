import { createPetLocalDataSource } from '../../modules/pets/data/datasources/PetLocalDataSource';
import { createReminderLocalDataSource } from '../../modules/reminders/data/datasources/ReminderLocalDataSource';
import { recordsComposition } from '../../modules/records/recordsComposition';
import { petComposition } from '../../modules/pets/petComposition';
import { remindersComposition } from '../../modules/reminders/remindersComposition';
import { scheduleComposition } from '../../modules/schedule/scheduleComposition';
import { normalizeStoredUser } from '../../modules/auth/domain/models/normalizeStoredUser';
import { storageService } from '../storage/storageService';
import { getTodayIsoDateLocal } from '../../shared/utils/calendarDate';
import {
  ensureNotificationsReady,
  type EnsureNotificationsReadyOptions,
} from './notificationDiagnostics';

const AUTH_USER_KEY = 'authUser';

async function readPersistedUserId(): Promise<string | null> {
  const raw = await storageService.getItem<unknown>(AUTH_USER_KEY);
  const user = normalizeStoredUser(raw);
  return user?.id ?? null;
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
  const pets = await petLocal.getPets(userId);
  const reminders = await reminderLocal.getReminders();
  const activePetId = (await petLocal.getActivePetId(userId)) ?? pets[0]?.id ?? null;

  if (pets.length > 0) {
    await petComposition.syncDailyRoutineNotifications(pets);
  }

  if (pets.length > 0) {
    await recordsComposition.syncDueNotificationsForPets(
      userId,
      pets.map(pet => pet.id),
    );
  }

  if (reminders.length > 0) {
    await remindersComposition.syncAllReminderNotifications(reminders);
  }

  if (activePetId != null) {
    const schedule = await scheduleComposition.buildDailySchedule.execute({
      userId,
      petId: activePetId,
      date: getTodayIsoDateLocal(),
    });
    if (schedule != null) {
      await scheduleComposition.syncScheduleNotifications(schedule, schedule.blocks);
    }
  }

  return true;
}
