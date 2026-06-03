import {
  buildSoundProfile,
  parseSoundProfile,
  SOUND_PROFILE_DATA_KEY,
  type AttentionTier,
  type NotificationTone,
} from './notificationSoundCatalog';

export type { AttentionTier, NotificationTone } from './notificationSoundCatalog';
export {
  ALL_SOUND_PROFILES,
  attentionTierFromDailyRoutine,
  attentionTierFromHealthSlot,
  attentionTierFromReminderLead,
  attentionTierFromScheduleLead,
  buildSoundProfile,
  channelDisplayName,
  channelIdForSoundProfile,
  SOUND_PROFILE_DATA_KEY,
  toneFromCareCategory,
  toneFromDailyRoutine,
} from './notificationSoundCatalog';

/** Mirrors `Pet.type` without importing the pets module from infrastructure. */
export type PetNotificationSpecies = 'dog' | 'cat';

/** Stored on notification `data` so the OS layer can pick dog vs cat sounds. */
export const PET_SPECIES_DATA_KEY = 'petSpecies';

export function isPetNotificationSpecies(
  value: string | undefined,
): value is PetNotificationSpecies {
  return value === 'dog' || value === 'cat';
}

export function resolveAndroidNotificationSound(
  data?: Record<string, string>,
): string {
  const profile = data?.[SOUND_PROFILE_DATA_KEY];
  if (profile != null && parseSoundProfile(profile) != null) {
    return profile;
  }
  const species = speciesFromNotificationData(data);
  if (species != null) {
    return buildSoundProfile(species, 'active', 'standard');
  }
  return 'default';
}

export function resolveIosNotificationSound(data?: Record<string, string>): string {
  const android = resolveAndroidNotificationSound(data);
  if (android === 'default') {
    return 'default';
  }
  return `${android}.wav`;
}

export function speciesFromNotificationData(
  data?: Record<string, string>,
): PetNotificationSpecies | undefined {
  const fromProfile = parseSoundProfile(data?.[SOUND_PROFILE_DATA_KEY]);
  if (fromProfile != null) {
    return fromProfile.species;
  }
  const species = data?.[PET_SPECIES_DATA_KEY];
  return isPetNotificationSpecies(species) ? species : undefined;
}

export function withNotificationSound(
  data: Record<string, string>,
  species: PetNotificationSpecies,
  tone: NotificationTone,
  tier: AttentionTier,
): Record<string, string> {
  const soundProfile = buildSoundProfile(species, tone, tier);
  return {
    ...data,
    [PET_SPECIES_DATA_KEY]: species,
    [SOUND_PROFILE_DATA_KEY]: soundProfile,
  };
}

/** @deprecated Prefer `withNotificationSound` for species + tone + tier. */
export function withPetSpeciesData(
  data: Record<string, string>,
  species: PetNotificationSpecies,
): Record<string, string> {
  return withNotificationSound(data, species, 'active', 'standard');
}
