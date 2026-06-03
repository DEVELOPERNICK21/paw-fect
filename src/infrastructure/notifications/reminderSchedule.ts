import type { NotificationService } from './notificationService';
import { attentionTierFromReminderLead } from './notificationSoundCatalog';
import {
  withNotificationSound,
  type PetNotificationSpecies,
} from './petNotificationSounds';
import { parseReminderLocalDateTime } from '../../shared/utils/reminderDateTime';

export { parseReminderLocalDateTime } from '../../shared/utils/reminderDateTime';

export interface ReminderScheduleInput {
  id: string;
  petId: string;
  title: string;
  date: string;
  time: string;
  petSpecies?: PetNotificationSpecies;
}

export function reminderNotificationIds(reminderId: string): [string, string, string] {
  return [
    `reminder-${reminderId}-24h`,
    `reminder-${reminderId}-1h`,
    `reminder-${reminderId}-due`,
  ];
}

export async function cancelReminderNotifications(
  reminderId: string,
  service: NotificationService,
): Promise<void> {
  for (const id of reminderNotificationIds(reminderId)) {
    await service.cancelNotification(id);
  }
}

export async function syncReminderNotifications(
  reminder: ReminderScheduleInput,
  service: NotificationService,
): Promise<number> {
  await cancelReminderNotifications(reminder.id, service);
  const event = parseReminderLocalDateTime(reminder.date, reminder.time);
  if (event == null) {
    return 0;
  }
  const eventMs = event.getTime();
  if (eventMs <= Date.now() + 1500) {
    return 0;
  }

  const titleBase = reminder.title.trim() || 'Reminder';
  const [id24, id1, idDue] = reminderNotificationIds(reminder.id);
  const baseData: Record<string, string> = {
    kind: 'reminder',
    reminderId: reminder.id,
    petId: reminder.petId,
  };
  const reminderTone = 'active' as const;

  const dataForLead = (lead: '24h' | '1h' | 'due'): Record<string, string> =>
    reminder.petSpecies != null
      ? withNotificationSound(
          baseData,
          reminder.petSpecies,
          reminderTone,
          attentionTierFromReminderLead(lead),
        )
      : baseData;

  let scheduled = 0;

  const t24 = new Date(eventMs - 24 * 60 * 60 * 1000);
  if (t24.getTime() > Date.now() + 1500) {
    await service.scheduleNotification({
      id: id24,
      title: `${titleBase} — tomorrow`,
      body: `Scheduled ${reminder.date} at ${reminder.time}. Tap to open.`,
      scheduledDate: t24,
      data: dataForLead('24h'),
    });
    scheduled += 1;
  }

  const t1 = new Date(eventMs - 60 * 60 * 1000);
  if (t1.getTime() > Date.now() + 1500) {
    await service.scheduleNotification({
      id: id1,
      title: `${titleBase} — starting soon`,
      body: `About an hour away (${reminder.time}). Tap to open.`,
      scheduledDate: t1,
      data: dataForLead('1h'),
    });
    scheduled += 1;
  }

  await service.scheduleNotification({
    id: idDue,
    title: titleBase,
    body: `Due now (${reminder.time}). Tap to open.`,
    scheduledDate: event,
    data: dataForLead('due'),
  });
  scheduled += 1;

  return scheduled;
}

export async function syncAllReminderNotifications(
  reminders: ReminderScheduleInput[],
  service: NotificationService,
): Promise<void> {
  for (const reminder of reminders) {
    await syncReminderNotifications(reminder, service);
  }
}
