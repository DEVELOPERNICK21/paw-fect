import notifee, {
  AndroidImportance,
  AuthorizationStatus,
} from '@notifee/react-native';

import { startupLog } from '../logging/startupLog';

import {
  ALL_SOUND_PROFILES,
  channelDisplayName,
  channelIdForSoundProfile,
  parseSoundProfile,
  type AttentionTier,
} from './notificationSoundCatalog';
import { PAWFECT_CHANNEL_GENERAL } from './notificationChannelRouting';

export {
  PAWFECT_CHANNEL_CARE,
  PAWFECT_CHANNEL_CARE_CAT,
  PAWFECT_CHANNEL_CARE_DOG,
  PAWFECT_CHANNEL_GENERAL,
  PAWFECT_CHANNEL_REMINDERS,
  PAWFECT_CHANNEL_REMINDERS_CAT,
  PAWFECT_CHANNEL_REMINDERS_DOG,
  PAWFECT_CHANNEL_ROUTINES,
  PAWFECT_CHANNEL_ROUTINES_CAT,
  PAWFECT_CHANNEL_ROUTINES_DOG,
  channelIdForNotificationData,
} from './notificationChannelRouting';

function importanceForTier(tier: AttentionTier): number {
  if (tier === 'urgent') {
    return AndroidImportance.HIGH;
  }
  if (tier === 'standard') {
    return AndroidImportance.DEFAULT;
  }
  return AndroidImportance.LOW;
}

function vibrationForTier(tier: AttentionTier): boolean {
  return tier !== 'soft';
}

let channelsReadyPromise: Promise<void> | null = null;
let permissionRequestPromise: Promise<boolean> | null = null;
let cachedPermissionGranted: boolean | null = null;

/**
 * Android channels + iOS permission. Safe to call on every cold start.
 * Each sound profile gets its own channel (required for custom sounds on API 26+).
 */
export async function ensureNotificationChannels(): Promise<void> {
  if (channelsReadyPromise != null) {
    return channelsReadyPromise;
  }

  channelsReadyPromise = (async () => {
    startupLog('notifications.channels.begin', `${ALL_SOUND_PROFILES.length} profiles`);
    for (const profile of ALL_SOUND_PROFILES) {
      const parsed = parseSoundProfile(profile);
      if (parsed == null) {
        continue;
      }
      await notifee.createChannel({
        id: channelIdForSoundProfile(profile),
        name: channelDisplayName(profile),
        importance: importanceForTier(parsed.tier),
        sound: profile,
        vibration: vibrationForTier(parsed.tier),
      });
    }

    await notifee.createChannel({
      id: PAWFECT_CHANNEL_GENERAL,
      name: 'Pawfect',
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
      vibration: false,
    });
    startupLog('notifications.channels.done');
  })().catch(error => {
    channelsReadyPromise = null;
    throw error;
  });

  return channelsReadyPromise;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (cachedPermissionGranted != null) {
    return cachedPermissionGranted;
  }
  if (permissionRequestPromise != null) {
    return permissionRequestPromise;
  }

  permissionRequestPromise = (async () => {
    startupLog('notifications.permission.request');
    const settings = await notifee.requestPermission();
    const granted =
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;
    cachedPermissionGranted = granted;
    startupLog('notifications.permission.result', granted ? 'granted' : 'denied');
    return granted;
  })().finally(() => {
    permissionRequestPromise = null;
  });

  return permissionRequestPromise;
}

/** Test-only reset for channel/permission singleton state. */
export function resetNotificationChannelStateForTests(): void {
  channelsReadyPromise = null;
  permissionRequestPromise = null;
  cachedPermissionGranted = null;
}
