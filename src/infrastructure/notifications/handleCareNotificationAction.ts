import notifee from '@notifee/react-native';

import { requestNotificationResync } from './requestNotificationResync';
import { getAppSessionUserId } from '../../shared/session/appSessionPorts';
import { getNotificationFeaturePorts } from './notificationFeaturePorts';
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
  const ports = getNotificationFeaturePorts();

  if (actionId === 'care-done') {
    await ports.markCareBlockDone({
      userId,
      petId,
      date,
      blockId,
    });
    await ports.cancelScheduleBlockNotification(blockId, petId);
    if (data.notificationId != null && data.notificationId.length > 0) {
      await notifee.cancelNotification(data.notificationId);
    }
    await requestNotificationResync();
    ports.invalidateHomeDashboard();
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

  await ports.snoozeCareBlock({
    userId,
    petId,
    date,
    blockId,
    currentTime: time,
    snoozeMinutes,
  });

  await ports.cancelScheduleBlockNotification(blockId, petId);
  await requestNotificationResync();
  await ports.syncGlanceForPetDate(userId, petId, date);
  ports.invalidateHomeDashboard();
  return true;
}
