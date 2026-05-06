import notifee, {
  AndroidImportance,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';

import {
  ANDROID_NOTIFICATION_ACCENT,
  ANDROID_NOTIFICATION_LARGE_ICON,
  ANDROID_NOTIFICATION_SMALL_ICON,
} from './androidNotificationAssets';
import {
  PAWFECT_CHANNEL_CARE,
  PAWFECT_CHANNEL_GENERAL,
  PAWFECT_CHANNEL_REMINDERS,
  PAWFECT_CHANNEL_ROUTINES,
} from './notificationChannels';
import type {
  ImmediateNotificationPayload,
  NotificationPayload,
  NotificationService,
} from './notificationService';
import { emitNotificationFeedEvent } from './notificationFeedEvents';

function channelIdForPayload(data?: Record<string, string>): string {
  if (data?.reminderId != null && data.reminderId.length > 0) {
    return PAWFECT_CHANNEL_REMINDERS;
  }
  if (data?.kind === 'dailyRoutine') {
    return PAWFECT_CHANNEL_ROUTINES;
  }
  if (data?.kind === 'loginWelcome') {
    return PAWFECT_CHANNEL_GENERAL;
  }
  return PAWFECT_CHANNEL_CARE;
}

function normalizeData(
  data?: Record<string, string>,
): Record<string, string> | undefined {
  if (data == null) {
    return undefined;
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

const androidBrandedAppearance = {
  smallIcon: ANDROID_NOTIFICATION_SMALL_ICON,
  largeIcon: ANDROID_NOTIFICATION_LARGE_ICON,
  color: ANDROID_NOTIFICATION_ACCENT,
} as const;

export class NotifeeNotificationService implements NotificationService {
  async scheduleNotification(payload: NotificationPayload): Promise<void> {
    const ts = payload.scheduledDate.getTime();
    const isRepeatingDaily = payload.repeat === 'daily';
    const isRepeatingWeekly = payload.repeat === 'weekly';
    const isRepeating = isRepeatingDaily || isRepeatingWeekly;
    if (Number.isNaN(ts) || (!isRepeating && ts <= Date.now() + 1500)) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[NotifeeNotificationService] skip schedule (past/near)', {
          id: payload.id,
          scheduledDate: payload.scheduledDate.toISOString(),
          repeat: payload.repeat,
        });
      }
      return;
    }

    const data = normalizeData(payload.data);
    const channelId = channelIdForPayload(data);
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: ts,
      alarmManager: {
        allowWhileIdle: true,
      },
    };
    if (isRepeatingDaily) {
      trigger.repeatFrequency = RepeatFrequency.DAILY;
    } else if (isRepeatingWeekly) {
      trigger.repeatFrequency = RepeatFrequency.WEEKLY;
    }

    try {
      await notifee.cancelNotification(payload.id);
      await notifee.createTriggerNotification(
        {
          id: payload.id,
          title: payload.title,
          body: payload.body,
          data,
          android: {
            channelId,
            importance: AndroidImportance.HIGH,
            ...androidBrandedAppearance,
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
          },
          ios: {
            sound: 'default',
          },
        },
        trigger,
      );
      // Do not mirror every future OS trigger into the in-app feed (onboarding schedules many at once).
      // The feed lists alerts once they are delivered or shown (immediate), not the full pending queue.
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[NotifeeNotificationService] schedule failed', error);
      }
    }
  }

  async displayImmediateNotification(
    payload: ImmediateNotificationPayload,
  ): Promise<void> {
    const data = normalizeData(payload.data);
    const channelId = channelIdForPayload(data);
    try {
      await notifee.displayNotification({
        id: payload.id,
        title: payload.title,
        body: payload.body,
        data,
        android: {
          channelId,
          importance: AndroidImportance.DEFAULT,
          ...androidBrandedAppearance,
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
        },
        ios: {
          sound: 'default',
        },
      });
      const deliveredAtIso = new Date().toISOString();
      emitNotificationFeedEvent({
        type: 'displayed',
        payload: {
          id: payload.id,
          title: payload.title,
          body: payload.body,
          data,
          deliveredAtIso,
        },
      });
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn(
          '[NotifeeNotificationService] displayImmediate failed',
          error,
        );
      }
    }
  }

  async cancelNotification(id: string): Promise<void> {
    try {
      await notifee.cancelNotification(id);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[NotifeeNotificationService] cancel failed', id, error);
      }
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[NotifeeNotificationService] cancelAll failed', error);
      }
    }
  }
}
