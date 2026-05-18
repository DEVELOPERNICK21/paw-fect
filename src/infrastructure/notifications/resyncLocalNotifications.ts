import { getAppSessionUserId } from '../../shared/session/appSessionPorts';
import { getTodayIsoDateLocal } from '../../shared/utils/calendarDate';
import { petComposition } from '../../modules/pets/petComposition';
import { recordsComposition } from '../../modules/records/recordsComposition';
import { remindersComposition } from '../../modules/reminders/remindersComposition';
import { usePetStore } from '../../modules/pets/store/petStore';
import { useReminderStore } from '../../modules/reminders/store/reminderStore';
import { scheduleComposition } from '../../modules/schedule/scheduleComposition';

import {
  ensureNotificationsReady,
  type EnsureNotificationsReadyOptions,
} from './notificationDiagnostics';

/**
 * Rebuilds every local notification pipeline (routines, smart health, reminders, today's schedule).
 * Call after login, cold start, or when the user re-enables notifications.
 */
export async function resyncAllLocalNotifications(
  options?: EnsureNotificationsReadyOptions,
): Promise<void> {
  const granted = await ensureNotificationsReady(options);
  if (!granted) {
    return;
  }

  const userId = getAppSessionUserId();
  const pets = usePetStore.getState().pets;
  const reminders = useReminderStore.getState().reminders;
  const activePetId = usePetStore.getState().activePet?.id ?? pets[0]?.id ?? null;

  if (pets.length > 0) {
    await petComposition.syncDailyRoutineNotifications(pets);
  }

  if (userId != null && pets.length > 0) {
    await recordsComposition.syncDueNotificationsForPets(
      userId,
      pets.map(pet => pet.id),
    );
  }

  if (reminders.length > 0) {
    await remindersComposition.syncAllReminderNotifications(reminders);
  }

  if (userId != null && activePetId != null) {
    const schedule = await scheduleComposition.buildDailySchedule.execute({
      userId,
      petId: activePetId,
      date: getTodayIsoDateLocal(),
    });
    if (schedule != null) {
      await scheduleComposition.syncScheduleNotifications(schedule, schedule.blocks);
    }
  }
}
