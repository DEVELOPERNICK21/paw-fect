import notifee, {
  AndroidImportance,
  AuthorizationStatus,
} from '@notifee/react-native';

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

/**
 * Android channels + iOS permission. Safe to call on every cold start.
 * Each sound profile gets its own channel (required for custom sounds on API 26+).
 */
export async function ensureNotificationChannels(): Promise<void> {
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
}

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}
