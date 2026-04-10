import type { NotificationService } from './notificationService';

export interface ReminderScheduleInput {
  id: string;
  petId: string;
  title: string;
  date: string;
  time: string;
}

export function reminderNotificationIds(reminderId: string): [string, string] {
  return [`reminder-${reminderId}-24h`, `reminder-${reminderId}-1h`];
}

/**
 * Parse reminder date (YYYY-MM-DD) and time (`09:00 AM` or `14:30`) in local timezone.
 */
export function parseReminderLocalDateTime(
  dateYmd: string,
  timeStr: string,
): Date | null {
  const parts = dateYmd.trim().split('-').map(Number);
  if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) {
    return null;
  }
  const [y, mo, d] = parts;
  const t = timeStr.trim();
  const m12 = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    let hour = parseInt(m12[1], 10);
    const min = parseInt(m12[2], 10);
    const ap = m12[3].toUpperCase();
    if (ap === 'PM' && hour !== 12) {
      hour += 12;
    }
    if (ap === 'AM' && hour === 12) {
      hour = 0;
    }
    return new Date(y, mo - 1, d, hour, min, 0, 0);
  }
  const m24 = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const hour = parseInt(m24[1], 10);
    const min = parseInt(m24[2], 10);
    return new Date(y, mo - 1, d, hour, min, 0, 0);
  }
  return null;
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
): Promise<void> {
  await cancelReminderNotifications(reminder.id, service);
  const event = parseReminderLocalDateTime(reminder.date, reminder.time);
  if (event == null) {
    return;
  }
  const eventMs = event.getTime();
  if (eventMs <= Date.now()) {
    return;
  }

  const titleBase = reminder.title.trim() || 'Reminder';
  const [id24, id1] = reminderNotificationIds(reminder.id);
  const data: Record<string, string> = {
    kind: 'reminder',
    reminderId: reminder.id,
    petId: reminder.petId,
  };

  const t24 = new Date(eventMs - 24 * 60 * 60 * 1000);
  if (t24.getTime() > Date.now() + 1500) {
    await service.scheduleNotification({
      id: id24,
      title: `${titleBase} — tomorrow`,
      body: `Scheduled ${reminder.date} at ${reminder.time}. Tap to open.`,
      scheduledDate: t24,
      data,
    });
  }

  const t1 = new Date(eventMs - 60 * 60 * 1000);
  if (t1.getTime() > Date.now() + 1500) {
    await service.scheduleNotification({
      id: id1,
      title: `${titleBase} — starting soon`,
      body: `About an hour away (${reminder.time}). Tap to open.`,
      scheduledDate: t1,
      data,
    });
  }
}

export async function syncAllReminderNotifications(
  reminders: ReminderScheduleInput[],
  service: NotificationService,
): Promise<void> {
  for (const r of reminders) {
    await syncReminderNotifications(r, service);
  }
}
