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
import { canUseAndroidExactAlarms } from './androidAlarmPermissions';
import { parseSoundProfile } from './notificationSoundCatalog';
import { channelIdForNotificationData } from './notificationChannels';
import {
  resolveAndroidNotificationSound,
  resolveIosNotificationSound,
} from './petNotificationSounds';
import type {
  ImmediateNotificationPayload,
  NotificationPayload,
  NotificationService,
} from './notificationService';
import { emitNotificationFeedEvent } from './notificationFeedEvents';
import { useSettingsStore } from '../../modules/settings/store/settingsStore';

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
    const notificationsEnabled =
      useSettingsStore.getState().settings?.notificationsEnabled ?? true;
    if (!notificationsEnabled) {
      return;
    }

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
    const channelId = channelIdForNotificationData(data);
    const iosSound = resolveIosNotificationSound(data);
    const androidSound = resolveAndroidNotificationSound(data);
    const profile = parseSoundProfile(data?.soundProfile);
    const androidImportance =
      profile?.tier === 'urgent'
        ? AndroidImportance.HIGH
        : profile?.tier === 'soft'
          ? AndroidImportance.LOW
          : AndroidImportance.DEFAULT;
    const exactAlarmAllowed = await canUseAndroidExactAlarms();
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: ts,
    };
    if (exactAlarmAllowed) {
      trigger.alarmManager = {
        allowWhileIdle: true,
      };
    }
    if (isRepeatingDaily) {
      trigger.repeatFrequency = RepeatFrequency.DAILY;
    } else if (isRepeatingWeekly) {
      trigger.repeatFrequency = RepeatFrequency.WEEKLY;
    }

    const androidActions =
      payload.actions?.map(action => ({
        title: action.title,
        pressAction: { id: action.pressActionId },
      })) ?? [];

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
            importance: androidImportance,
            ...(androidSound !== 'default' ? { sound: androidSound } : {}),
            ...androidBrandedAppearance,
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
            ...(androidActions.length > 0 ? { actions: androidActions } : {}),
          },
          ios: {
            sound: iosSound,
            ...(payload.actions != null && payload.actions.length > 0
              ? {
                  categoryId: 'care_schedule',
                }
              : {}),
          },
        },
        trigger,
      );
      // Do not mirror every future OS trigger into the in-app feed (onboarding schedules many at once).
      // The feed lists alerts once they are delivered or shown (immediate), not the full pending queue.
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[NotifeeNotificationService] schedule failed', {
          id: payload.id,
          scheduledDate: payload.scheduledDate.toISOString(),
          error,
        });
      }
    }
  }

  async displayImmediateNotification(
    payload: ImmediateNotificationPayload,
  ): Promise<void> {
    const notificationsEnabled =
      useSettingsStore.getState().settings?.notificationsEnabled ?? true;
    if (!notificationsEnabled) {
      return;
    }

    const data = normalizeData(payload.data);
    const channelId = channelIdForNotificationData(data);
    const iosSound = resolveIosNotificationSound(data);
    const androidSound = resolveAndroidNotificationSound(data);
    const displayProfile = parseSoundProfile(data?.soundProfile);
    const displayImportance =
      displayProfile?.tier === 'urgent'
        ? AndroidImportance.HIGH
        : displayProfile?.tier === 'soft'
          ? AndroidImportance.LOW
          : AndroidImportance.DEFAULT;
    try {
      await notifee.displayNotification({
        id: payload.id,
        title: payload.title,
        body: payload.body,
        data,
        android: {
          channelId,
          importance: displayImportance,
          ...(androidSound !== 'default' ? { sound: androidSound } : {}),
          ...androidBrandedAppearance,
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
        },
        ios: {
          sound: iosSound,
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
