import type { SmartHealthRecord } from '../../modules/records/domain/models/SmartHealthRecord';
import { getTodayIsoDateLocal } from '../../shared/utils/calendarDate';
import type { NotificationService } from './notificationService';
import { attentionTierFromHealthSlot } from './notificationSoundCatalog';
import {
  withNotificationSound,
  type PetNotificationSpecies,
} from './petNotificationSounds';
import {
  computeSmartHealthNotificationCoverage,
  getSchedulableHealthRecords,
  selectHealthRecordsForNotifications,
  type SmartHealthNotificationCoverage,
} from './smartHealthNotificationSelection';

export {
  computeSmartHealthNotificationCoverage,
  getSchedulableHealthRecords,
  MAX_HEALTH_NOTIFICATIONS_PER_PET,
  MAX_HEALTH_NOTIFICATIONS_TOTAL,
  selectHealthRecordsForNotifications,
  type SmartHealthNotificationCoverage,
} from './smartHealthNotificationSelection';

const DUE_HOUR = 9;
const DUE_MINUTE = 0;

export function smartHealthNotificationIds(
  recordId: string,
): [string, string, string] {
  const base = `health-${recordId}`;
  return [`${base}-d2`, `${base}-due`, `${base}-overdue`];
}

export function localDateOnCalendarDay(
  ymd: string,
  hour: number,
  minute: number,
): Date {
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) {
    return new Date(Number.NaN);
  }
  const [y, mo, d] = parts;
  return new Date(y, mo - 1, d, hour, minute, 0, 0);
}

export async function cancelSmartHealthNotificationsForRecord(
  recordId: string,
  service: NotificationService,
): Promise<void> {
  for (const id of smartHealthNotificationIds(recordId)) {
    await service.cancelNotification(id);
  }
}

export async function scheduleSmartHealthDueNotifications(
  record: SmartHealthRecord,
  service: NotificationService,
  petSpecies?: PetNotificationSpecies,
): Promise<void> {
  if (record.status === 'completed' || record.status === 'skipped') {
    await cancelSmartHealthNotificationsForRecord(record.id, service);
    return;
  }

  await cancelSmartHealthNotificationsForRecord(record.id, service);

  const dueDate = localDateOnCalendarDay(record.dueDate, DUE_HOUR, DUE_MINUTE);
  const twoDaysBefore = new Date(dueDate);
  twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);

  const overdueDate = new Date(dueDate);
  overdueDate.setDate(overdueDate.getDate() + 1);

  const isOverdueContext = getTodayIsoDateLocal() > record.dueDate;
  const baseData: Record<string, string> = {
    recordId: record.id,
    petId: record.petId,
    type: String(record.type),
    kind: 'smartHealth',
  };

  const dataForSlot = (slot: 'd2' | 'due' | 'overdue'): Record<string, string> =>
    petSpecies != null
      ? withNotificationSound(
          baseData,
          petSpecies,
          'health',
          attentionTierFromHealthSlot(slot),
        )
      : baseData;

  const [idD2, idDue, idOverdue] = smartHealthNotificationIds(record.id);
  const slots: Array<{
    id: string;
    slot: 'd2' | 'due' | 'overdue';
    title: string;
    body: string;
    scheduledDate: Date;
  }> = [
    {
      id: idD2,
      slot: 'd2',
      title: `${record.name} due soon`,
      body: `${record.name} is due in 2 days. Tap to open health records.`,
      scheduledDate: twoDaysBefore,
    },
    {
      id: idDue,
      slot: 'due',
      title: `${record.name} is due today`,
      body: 'Please complete this health task today.',
      scheduledDate: dueDate,
    },
    {
      id: idOverdue,
      slot: 'overdue',
      title: `${record.name} is overdue`,
      body: isOverdueContext
        ? 'This dose was missed — open the app to get back on track.'
        : 'This health task is now overdue.',
      scheduledDate: overdueDate,
    },
  ];

  for (const slot of slots) {
    if (slot.scheduledDate.getTime() <= Date.now() + 1500) {
      continue;
    }
    await service.scheduleNotification({
      id: slot.id,
      title: slot.title,
      body: slot.body,
      scheduledDate: slot.scheduledDate,
      data: dataForSlot(slot.slot),
    });
  }
}

export async function syncAllSmartHealthDueNotifications(
  records: SmartHealthRecord[],
  service: NotificationService,
  petSpeciesByPetId?: ReadonlyMap<string, PetNotificationSpecies>,
): Promise<SmartHealthNotificationCoverage> {
  const schedulable = getSchedulableHealthRecords(records);
  const selected = selectHealthRecordsForNotifications(records);
  const selectedIds = new Set(selected.map(record => record.id));
  const schedulableIds = new Set(schedulable.map(record => record.id));

  for (const record of records) {
    if (!schedulableIds.has(record.id) || !selectedIds.has(record.id)) {
      await cancelSmartHealthNotificationsForRecord(record.id, service);
    }
  }

  for (const record of selected) {
    await scheduleSmartHealthDueNotifications(
      record,
      service,
      petSpeciesByPetId?.get(record.petId),
    );
  }

  return computeSmartHealthNotificationCoverage(records);
}
