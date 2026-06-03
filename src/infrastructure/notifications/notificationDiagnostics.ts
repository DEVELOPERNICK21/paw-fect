import notifee from '@notifee/react-native';
import { Platform } from 'react-native';

import type { AttentionTier, NotificationTone } from './notificationSoundCatalog';
import {
  ensureNotificationChannels,
  requestNotificationPermission,
} from './notificationChannels';
import { notificationService } from './notificationService';
import {
  buildSoundProfile,
  withNotificationSound,
  type PetNotificationSpecies,
} from './petNotificationSounds';
import {
  canUseAndroidExactAlarms,
  openAndroidExactAlarmSettings,
} from './androidAlarmPermissions';

const TEST_NOTIFICATION_ID = 'pawfect-notification-test';

export const NOTIFICATION_SELF_TEST_DELAY_MS = 2 * 60 * 1000;

export interface NotificationSelfTestOptions {
  petSpecies: PetNotificationSpecies;
  /** Defaults to `active` (walk/play style). */
  tone?: NotificationTone;
  /** Defaults to `urgent` so the test is easy to hear vs the system default. */
  tier?: AttentionTier;
}

export interface EnsureNotificationsReadyOptions {
  /** Opens Android "Alarms & reminders" when exact-alarm permission is off. */
  promptExactAlarmIfDisabled?: boolean;
  /** Require exact alarms instead of allowing inexact trigger fallback. */
  requireExactAlarm?: boolean;
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

  const exactAlarmAllowed = await canUseAndroidExactAlarms();
  if (!exactAlarmAllowed) {
    if (options?.promptExactAlarmIfDisabled) {
      await openAndroidExactAlarmSettings();
      return false;
    }
    return options?.requireExactAlarm !== true;
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
    return triggers.filter(row => row.notification?.id?.startsWith('reminder-'))
      .length;
  } catch {
    return 0;
  }
}

export async function scheduleNotificationSelfTest(
  delayMs = NOTIFICATION_SELF_TEST_DELAY_MS,
  options?: NotificationSelfTestOptions,
): Promise<{ scheduledDate: Date; soundProfile?: string }> {
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

  const tone = options?.tone ?? 'active';
  const tier = options?.tier ?? 'urgent';
  const data =
    options?.petSpecies != null
      ? withNotificationSound(
          { kind: 'notificationTest' },
          options.petSpecies,
          tone,
          tier,
        )
      : { kind: 'notificationTest' };

  const scheduledDate = new Date(Date.now() + delayMs);
  await notificationService.scheduleNotification({
    id: TEST_NOTIFICATION_ID,
    title: 'Paw-fect test notification',
    body:
      options?.petSpecies != null
        ? `Custom ${options.petSpecies} alert sound (${tone}, ${tier}). Scheduled delivery works on this device.`
        : 'If you see this alert, scheduled notifications work on this device.',
    scheduledDate,
    data,
  });

  const soundProfile =
    options?.petSpecies != null
      ? buildSoundProfile(options.petSpecies, tone, tier)
      : undefined;

  return { scheduledDate, soundProfile };
}
