import type { PetNotificationSpecies } from './petNotificationSounds';

/** What the notification is about — drives the “character” of the sound. */
export type NotificationTone = 'meal' | 'active' | 'care' | 'health';

/**
 * How much attention the alert should grab (lead time / urgency).
 * - soft: far ahead (24h, 2-day health, gentle routines)
 * - standard: soon (1h, due today, daily activity)
 * - urgent: now / overdue
 */
export type AttentionTier = 'soft' | 'standard' | 'urgent';

export const SOUND_PROFILE_DATA_KEY = 'soundProfile';

const SPECIES_LIST: readonly PetNotificationSpecies[] = ['dog', 'cat'];
const TONE_LIST: readonly NotificationTone[] = ['meal', 'active', 'care', 'health'];
const TIER_LIST: readonly AttentionTier[] = ['soft', 'standard', 'urgent'];

export function buildSoundProfile(
  species: PetNotificationSpecies,
  tone: NotificationTone,
  tier: AttentionTier,
): string {
  return `${species}_${tone}_${tier}`;
}

export const ALL_SOUND_PROFILES: readonly string[] = SPECIES_LIST.flatMap(species =>
  TONE_LIST.flatMap(tone => TIER_LIST.map(tier => buildSoundProfile(species, tone, tier))),
);

export function channelIdForSoundProfile(profile: string): string {
  return `pawfect-${profile}`;
}

export function channelDisplayName(profile: string): string {
  const [species, tone, tier] = profile.split('_') as [
    PetNotificationSpecies,
    NotificationTone,
    AttentionTier,
  ];
  const speciesLabel = species === 'dog' ? 'Dog' : 'Cat';
  const toneLabels: Record<NotificationTone, string> = {
    meal: 'Meals',
    active: 'Walk & play',
    care: 'Grooming & care',
    health: 'Health',
  };
  const tierLabels: Record<AttentionTier, string> = {
    soft: 'gentle',
    standard: 'standard',
    urgent: 'urgent',
  };
  return `${speciesLabel} · ${toneLabels[tone]} (${tierLabels[tier]})`;
}

export function toneFromCareCategory(category: string): NotificationTone {
  switch (category) {
    case 'feeding':
      return 'meal';
    case 'walk':
    case 'play':
    case 'training':
    case 'rest':
      return 'active';
    case 'potty':
    case 'grooming':
    case 'litter':
    case 'bedtime':
      return 'care';
    case 'health_check':
    case 'medication':
      return 'health';
    default:
      return 'active';
  }
}

export function toneFromDailyRoutine(routine: string): NotificationTone {
  switch (routine) {
    case 'feed':
      return 'meal';
    case 'walk':
    case 'play':
      return 'active';
    case 'groom':
      return 'care';
    default:
      return 'active';
  }
}

export function attentionTierFromReminderLead(
  lead: '24h' | '1h' | 'due',
): AttentionTier {
  if (lead === '24h') {
    return 'soft';
  }
  if (lead === '1h') {
    return 'standard';
  }
  return 'urgent';
}

export function attentionTierFromHealthSlot(
  slot: 'd2' | 'due' | 'overdue',
): AttentionTier {
  if (slot === 'd2') {
    return 'soft';
  }
  if (slot === 'due') {
    return 'standard';
  }
  return 'urgent';
}

/** Maps schedule block early-reminder lead time to attention tier. */
export function attentionTierFromScheduleLead(
  reminderMinutesBefore: number,
): AttentionTier {
  if (reminderMinutesBefore >= 60) {
    return 'soft';
  }
  if (reminderMinutesBefore >= 15) {
    return 'standard';
  }
  return 'urgent';
}

export function attentionTierFromDailyRoutine(routine: string): AttentionTier {
  if (routine === 'feed' || routine === 'groom') {
    return 'soft';
  }
  return 'standard';
}

export function parseSoundProfile(
  profile: string | undefined,
): {
  species: PetNotificationSpecies;
  tone: NotificationTone;
  tier: AttentionTier;
} | null {
  if (profile == null) {
    return null;
  }
  const parts = profile.split('_');
  if (parts.length !== 3) {
    return null;
  }
  const [species, tone, tier] = parts;
  if (species !== 'dog' && species !== 'cat') {
    return null;
  }
  if (!TONE_LIST.includes(tone as NotificationTone)) {
    return null;
  }
  if (!TIER_LIST.includes(tier as AttentionTier)) {
    return null;
  }
  return {
    species,
    tone: tone as NotificationTone,
    tier: tier as AttentionTier,
  };
}
