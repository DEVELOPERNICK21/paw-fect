import notifee from '@notifee/react-native';

import { buildCareScheduleNotificationActions } from '../../../../infrastructure/notifications/careNotificationActions';
import { parseReminderLocalDateTime } from '../../../../shared/utils/reminderDateTime';
import type { NotificationService } from '../../../../infrastructure/notifications/notificationService';
import type { DailyCareBlock } from '../../domain/models/DailyCareBlock';
import type { DailySchedule } from '../../domain/models/DailySchedule';

const MAX_PENDING_NOTIFICATIONS = 64;

const CATEGORY_PRIORITY: Record<DailyCareBlock['category'], number> = {
  feeding: 1,
  medication: 2,
  walk: 3,
  potty: 4,
  play: 5,
  litter: 5,
  grooming: 6,
  health_check: 7,
  training: 8,
  rest: 9,
  bedtime: 10,
};

export function scheduleNotificationId(petId: string, blockId: string): string {
  return `schedule-block-${petId}-${blockId}`;
}

async function cancelScheduleTriggersForPet(
  petId: string,
  service: NotificationService,
): Promise<void> {
  try {
    const triggers = await notifee.getTriggerNotifications();
    for (const row of triggers) {
      const id = row.notification?.id;
      if (id != null && id.startsWith(`schedule-block-${petId}-`)) {
        await service.cancelNotification(id);
      }
    }
  } catch {
    // Best effort cleanup before rescheduling.
  }
}

function scheduleDateForBlock(
  scheduleDate: string,
  block: DailyCareBlock,
): Date | null {
  const event = parseReminderLocalDateTime(scheduleDate, block.scheduledTime);
  if (!event) {
    return null;
  }
  if (block.reminderMinutesBefore > 0) {
    event.setMinutes(event.getMinutes() - block.reminderMinutesBefore);
  }
  return event;
}

export async function cancelScheduleBlockNotification(
  blockId: string,
  petId: string,
  service: NotificationService,
): Promise<void> {
  await service.cancelNotification(scheduleNotificationId(petId, blockId));
}

export async function syncScheduleNotifications(
  schedule: DailySchedule,
  blocks: DailyCareBlock[],
  service: NotificationService,
): Promise<number> {
  await cancelScheduleTriggersForPet(schedule.petId, service);

  const pending = blocks
    .filter(block => block.reminderEnabled && !block.isCompleted)
    .sort((left, right) => {
      const priorityDelta =
        CATEGORY_PRIORITY[left.category] - CATEGORY_PRIORITY[right.category];
      if (priorityDelta !== 0) {
        return priorityDelta;
      }
      return left.scheduledTime.localeCompare(right.scheduledTime);
    })
    .slice(0, MAX_PENDING_NOTIFICATIONS);

  let scheduled = 0;
  for (const block of pending) {
    const scheduledDate = scheduleDateForBlock(schedule.date, block);
    if (!scheduledDate || scheduledDate.getTime() <= Date.now() + 1500) {
      continue;
    }
    const repeat =
      block.frequency === 'weekly'
        ? 'weekly'
        : block.frequency === 'daily'
          ? 'daily'
          : undefined;
    const notificationId = scheduleNotificationId(schedule.petId, block.id);
    await service.scheduleNotification({
      id: notificationId,
      title: block.notificationTitle,
      body: block.notificationBody,
      scheduledDate,
      repeat,
      data: {
        kind: 'dailySchedule',
        petId: schedule.petId,
        blockId: block.id,
        date: schedule.date,
        scheduledTime: block.scheduledTime,
        notificationId,
      },
      actions: buildCareScheduleNotificationActions().map(action => ({
        title: action.title,
        pressActionId: action.pressAction.id,
      })),
    });
    scheduled += 1;
  }
  return scheduled;
}

export async function reconcileScheduleNotifications(
  schedule: DailySchedule,
  blocks: DailyCareBlock[],
  service: NotificationService,
): Promise<number> {
  return syncScheduleNotifications(schedule, blocks, service);
}
