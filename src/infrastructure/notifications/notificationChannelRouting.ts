import {
  channelIdForSoundProfile,
  parseSoundProfile,
  SOUND_PROFILE_DATA_KEY,
} from './notificationSoundCatalog';
import { isPetNotificationSpecies, PET_SPECIES_DATA_KEY } from './petNotificationSounds';

export const PAWFECT_CHANNEL_GENERAL = 'pawfect-general';

/** Legacy channel ids (pre profile sounds). */
export const PAWFECT_CHANNEL_CARE = 'pawfect-care';
export const PAWFECT_CHANNEL_CARE_CAT = 'pawfect-care-cat';
export const PAWFECT_CHANNEL_CARE_DOG = 'pawfect-care-dog';
export const PAWFECT_CHANNEL_REMINDERS = 'pawfect-reminders';
export const PAWFECT_CHANNEL_REMINDERS_CAT = 'pawfect-reminders-cat';
export const PAWFECT_CHANNEL_REMINDERS_DOG = 'pawfect-reminders-dog';
export const PAWFECT_CHANNEL_ROUTINES = 'pawfect-routines';
export const PAWFECT_CHANNEL_ROUTINES_CAT = 'pawfect-routines-cat';
export const PAWFECT_CHANNEL_ROUTINES_DOG = 'pawfect-routines-dog';

/**
 * Android 8+ plays channel sound — one channel per sound profile.
 */
export function channelIdForNotificationData(
  data?: Record<string, string>,
): string {
  const profile = data?.[SOUND_PROFILE_DATA_KEY];
  if (profile != null && parseSoundProfile(profile) != null) {
    return channelIdForSoundProfile(profile);
  }

  const species = data?.[PET_SPECIES_DATA_KEY];
  const dog = species === 'dog';
  const cat = species === 'cat';

  if (data?.reminderId != null && data.reminderId.length > 0) {
    if (dog) {
      return PAWFECT_CHANNEL_REMINDERS_DOG;
    }
    if (cat) {
      return PAWFECT_CHANNEL_REMINDERS_CAT;
    }
    return PAWFECT_CHANNEL_REMINDERS;
  }
  if (data?.kind === 'dailyRoutine') {
    if (dog) {
      return PAWFECT_CHANNEL_ROUTINES_DOG;
    }
    if (cat) {
      return PAWFECT_CHANNEL_ROUTINES_CAT;
    }
    return PAWFECT_CHANNEL_ROUTINES;
  }
  if (data?.kind === 'loginWelcome' || data?.kind === 'notificationTest') {
    return PAWFECT_CHANNEL_GENERAL;
  }
  if (dog) {
    return PAWFECT_CHANNEL_CARE_DOG;
  }
  if (cat) {
    return PAWFECT_CHANNEL_CARE_CAT;
  }
  return PAWFECT_CHANNEL_CARE;
}
