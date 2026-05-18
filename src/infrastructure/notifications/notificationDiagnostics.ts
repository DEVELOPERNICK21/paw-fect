import notifee, { AndroidNotificationSetting } from '@notifee/react-native';
import { Platform } from 'react-native';

import {
  ensureNotificationChannels,
  requestNotificationPermission,
} from './notificationChannels';
import { notificationService } from './notificationService';

const TEST_NOTIFICATION_ID = 'pawfect-notification-test';

export const NOTIFICATION_SELF_TEST_DELAY_MS = 2 * 60 * 1000;

export interface EnsureNotificationsReadyOptions {
  /** Opens Android "Alarms & reminders" when exact-alarm permission is off. */
  promptExactAlarmIfDisabled?: boolean;
}

/**
 * Ensures channels, POST_NOTIFICATIONS, and (Android 12+) exact-alarm permission
 * required for Notifee timestamp triggers. Immediate alerts (e.g. login welcome) only need POST_NOTIFICATIONS.
 */
export async function ensureNotificationsReady(
  options?: EnsureNotificationsReadyOptions,
): Promise<boolean> {
  await ensureNotificationChannels();
  const granted = await requestNotificationPermission();
  if (!granted) {
    return false;
  }

  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const settings = await notifee.getNotificationSettings();
    if (settings.android.alarm === AndroidNotificationSetting.DISABLED) {
      if (options?.promptExactAlarmIfDisabled) {
        await notifee.openAlarmPermissionSettings();
      }
      return false;
    }
  } catch {
    // Best effort — proceed if the OS API is unavailable.
  }

  return true;
}

export async function countPendingTriggerNotifications(): Promise<number> {
  try {
    const triggers = await notifee.getTriggerNotifications();
    return triggers.length;
  } catch {
    return 0;
  }
}

export async function countPendingReminderNotifications(): Promise<number> {
  try {
    const triggers = await notifee.getTriggerNotifications();
    return triggers.filter(row =>
      row.notification?.id?.startsWith('reminder-'),
    ).length;
  } catch {
    return 0;
  }
}

export async function scheduleNotificationSelfTest(
  delayMs = NOTIFICATION_SELF_TEST_DELAY_MS,
): Promise<Date> {
  const granted = await ensureNotificationsReady({
    promptExactAlarmIfDisabled: true,
  });
  if (!granted) {
    throw new Error(
      Platform.OS === 'android'
        ? 'Allow notifications and turn on "Alarms & reminders" for Paw-fect in system settings, then try again.'
        : 'Notification permission was not granted. Allow alerts for Paw-fect in system settings.',
    );
  }

  const scheduledDate = new Date(Date.now() + delayMs);
  await notificationService.scheduleNotification({
    id: TEST_NOTIFICATION_ID,
    title: 'Paw-fect test notification',
    body: 'If you see this alert, scheduled notifications work on this device.',
    scheduledDate,
    data: { kind: 'notificationTest' },
  });
  return scheduledDate;
}
