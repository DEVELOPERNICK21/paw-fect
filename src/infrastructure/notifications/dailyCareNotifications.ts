import notifee from '@notifee/react-native';

import type { NotificationService } from './notificationService';

/** Mirrors `Pet.type` without importing the pets module from infrastructure. */
export type DailyRoutinePetSpecies = 'dog' | 'cat';

/** Local wall-clock defaults for meals (can move to settings later). */
export const DEFAULT_FEED_HOUR = 8;
export const DEFAULT_FEED_MINUTE = 0;

/** Dog: evening walk */
export const DEFAULT_DOG_ACTIVITY_HOUR = 18;
export const DEFAULT_DOG_ACTIVITY_MINUTE = 0;

/** Cat: short evening play / enrichment (crepuscular-friendly). */
export const DEFAULT_CAT_ACTIVITY_HOUR = 20;
export const DEFAULT_CAT_ACTIVITY_MINUTE = 0;

/** Weekly bath / heavy rinse — dogs (Sunday morning). */
export const DEFAULT_DOG_GROOM_WEEKDAY = 0;
export const DEFAULT_DOG_GROOM_HOUR = 10;
export const DEFAULT_DOG_GROOM_MINUTE = 0;

/** Weekly grooming (brush / light clean) — cats (Saturday late morning). */
export const DEFAULT_CAT_GROOM_WEEKDAY = 6;
export const DEFAULT_CAT_GROOM_HOUR = 11;
export const DEFAULT_CAT_GROOM_MINUTE = 0;

export interface DailyRoutinePetInput {
  id: string;
  name: string;
  type: DailyRoutinePetSpecies;
}

function routineIds(petId: string): { feed: string; activity: string; groom: string } {
  return {
    feed: `routine-feed-${petId}`,
    activity: `routine-activity-${petId}`,
    groom: `routine-groom-${petId}`,
  };
}

/**
 * Next local Date at hour:minute; if that moment is in the past (or within ~2s), use tomorrow.
 */
export function nextLocalOccurrence(hour: number, minute: number): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime() + 1500) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

/**
 * Next local occurrence of a given weekday (0 = Sunday … 6 = Saturday) at hour:minute.
 */
export function nextWeeklyOccurrence(weekday: number, hour: number, minute: number): Date {
  const now = new Date();
  for (let add = 0; add <= 14; add += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() + add);
    d.setHours(hour, minute, 0, 0);
    if (d.getDay() !== weekday) continue;
    if (d.getTime() <= now.getTime() + 1500) continue;
    return d;
  }
  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 7);
  fallback.setHours(hour, minute, 0, 0);
  return fallback;
}

async function cancelAllRoutineTriggers(service: NotificationService): Promise<void> {
  try {
    const triggers = await notifee.getTriggerNotifications();
    for (const row of triggers) {
      const id = row.notification?.id;
      if (
        id != null &&
        (id.startsWith('routine-feed-') ||
          id.startsWith('routine-walk-') ||
          id.startsWith('routine-activity-') ||
          id.startsWith('routine-groom-'))
      ) {
        await service.cancelNotification(id);
      }
    }
  } catch {
    // If native API fails, still try scheduling (may duplicate until next full sync).
  }
}

/**
 * Rebuilds daily repeating notifications (meal + species activity) and a weekly groom/bath
 * nudge for every pet in the list. Cancels any previous routine-* triggers first.
 */
export async function syncDailyRoutineNotificationsForPets(
  pets: DailyRoutinePetInput[],
  service: NotificationService,
): Promise<void> {
  await cancelAllRoutineTriggers(service);
  const displayName = (name: string): string => name.trim() || 'your pet';

  for (const pet of pets) {
    const label = displayName(pet.name);
    const { feed, activity, groom } = routineIds(pet.id);
    const baseData: Record<string, string> = {
      kind: 'dailyRoutine',
      petId: pet.id,
    };

    await service.scheduleNotification({
      id: feed,
      title: `Time to feed ${label}`,
      body: `A regular meal helps ${label} stay happy and healthy.`,
      scheduledDate: nextLocalOccurrence(DEFAULT_FEED_HOUR, DEFAULT_FEED_MINUTE),
      repeat: 'daily',
      data: { ...baseData, routine: 'feed' },
    });

    if (pet.type === 'dog') {
      await service.scheduleNotification({
        id: activity,
        title: `Walk time for ${label}`,
        body: `Stretch those legs — ${label} will thank you.`,
        scheduledDate: nextLocalOccurrence(
          DEFAULT_DOG_ACTIVITY_HOUR,
          DEFAULT_DOG_ACTIVITY_MINUTE,
        ),
        repeat: 'daily',
        data: { ...baseData, routine: 'walk' },
      });

      await service.scheduleNotification({
        id: groom,
        title: `Bath time for ${label}?`,
        body: `A weekly rinse or brush keeps ${label} comfortable (adjust if your vet advises otherwise).`,
        scheduledDate: nextWeeklyOccurrence(
          DEFAULT_DOG_GROOM_WEEKDAY,
          DEFAULT_DOG_GROOM_HOUR,
          DEFAULT_DOG_GROOM_MINUTE,
        ),
        repeat: 'weekly',
        data: { ...baseData, routine: 'groom' },
      });
    } else {
      await service.scheduleNotification({
        id: activity,
        title: `Play time for ${label}`,
        body: `A short play session keeps ${label} engaged and calm.`,
        scheduledDate: nextLocalOccurrence(
          DEFAULT_CAT_ACTIVITY_HOUR,
          DEFAULT_CAT_ACTIVITY_MINUTE,
        ),
        repeat: 'daily',
        data: { ...baseData, routine: 'play' },
      });

      await service.scheduleNotification({
        id: groom,
        title: `Grooming check-in for ${label}`,
        body: `Brush ${label} and check ears — weekly grooming beats surprise mats.`,
        scheduledDate: nextWeeklyOccurrence(
          DEFAULT_CAT_GROOM_WEEKDAY,
          DEFAULT_CAT_GROOM_HOUR,
          DEFAULT_CAT_GROOM_MINUTE,
        ),
        repeat: 'weekly',
        data: { ...baseData, routine: 'groom' },
      });
    }
  }
}

export async function cancelDailyRoutineForPet(
  petId: string,
  service: NotificationService,
): Promise<void> {
  const { feed, activity, groom } = routineIds(petId);
  await service.cancelNotification(feed);
  await service.cancelNotification(activity);
  await service.cancelNotification(groom);
  await service.cancelNotification(`routine-walk-${petId}`);
}
