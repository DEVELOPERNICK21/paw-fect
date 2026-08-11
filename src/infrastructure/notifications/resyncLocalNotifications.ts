import { getAppSessionUserId } from '../../shared/session/appSessionPorts';
import { getTodayIsoDateLocal } from '../../shared/utils/calendarDate';
import { recordsComposition } from '../../modules/records/recordsComposition';
import { usePetStore } from '../../modules/pets/store/petStore';
import { useReminderStore } from '../../modules/reminders/store/reminderStore';
import type { Reminder } from '../../modules/reminders/domain/models/Reminder';
import { scheduleComposition } from '../../modules/schedule/scheduleComposition';

import { applyMustFireNotificationPlan } from './applyMustFireNotificationPlan';
import {
  ensureNotificationsReady,
  type EnsureNotificationsReadyOptions,
} from './notificationDiagnostics';
import type { ReminderScheduleInput } from './reminderSchedule';
import type { PetNotificationSpecies } from './petNotificationSounds';

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
 * Rebuilds every must-fire local notification pipeline (smart health, reminders, all pets' schedules).
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
  if (userId == null) {
    return;
  }

  const pets = usePetStore.getState().pets;
  const reminders = useReminderStore.getState().reminders;
  const activePetId = usePetStore.getState().activePet?.id ?? pets[0]?.id ?? null;
  const petSpeciesByPetId = new Map(pets.map(pet => [pet.id, pet.type] as const));
  const today = getTodayIsoDateLocal();

  const healthRecords = (
    await Promise.all(
      pets.map(pet => recordsComposition.getSmartHealthRecords.execute(userId, pet.id)),
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
}
