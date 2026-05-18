import notifee from '@notifee/react-native';

import { scheduleComposition } from '../../modules/schedule/scheduleComposition';
import { getAppSessionUserId } from '../../shared/session/appSessionPorts';
import { appOrchestrator } from '../../modules/app/appComposition';

import {
  isCareNotificationActionId,
  snoozeMinutesForAction,
} from './careNotificationActions';

export async function handleCareNotificationAction(
  actionId: string | undefined,
  data: Record<string, string> | undefined,
): Promise<boolean> {
  if (
    data?.kind !== 'dailySchedule' ||
    !isCareNotificationActionId(actionId) ||
    data.petId == null ||
    data.blockId == null ||
    data.date == null
  ) {
    return false;
  }

  const userId = getAppSessionUserId();
  if (userId == null) {
    return false;
  }

  const { petId, blockId, date, scheduledTime } = data;

  if (actionId === 'care-done') {
    await scheduleComposition.markCareBlockDone.execute({
      userId,
      petId,
      date,
      blockId,
      completed: true,
    });
    await scheduleComposition.cancelScheduleBlockNotification(blockId, petId);
    if (data.notificationId != null && data.notificationId.length > 0) {
      await notifee.cancelNotification(data.notificationId);
    }
    appOrchestrator.invalidateHomeDashboard();
    return true;
  }

  const snoozeMinutes = snoozeMinutesForAction(actionId);
  if (snoozeMinutes == null) {
    return false;
  }

  const time =
    scheduledTime != null && scheduledTime.length > 0
      ? scheduledTime
      : '12:00';

  await scheduleComposition.snoozeCareBlock.execute({
    userId,
    petId,
    date,
    blockId,
    currentTime: time,
    snoozeMinutes,
  });

  const schedule = await scheduleComposition.buildDailySchedule.execute({
    userId,
    petId,
    date,
  });
  if (schedule != null) {
    await scheduleComposition.syncScheduleNotifications(
      schedule,
      schedule.blocks,
    );
    await scheduleComposition.syncGlanceForSchedule(schedule);
  }

  appOrchestrator.invalidateHomeDashboard();
  return true;
}
