import notifee from '@notifee/react-native';

import type { NotificationService } from './notificationService';

/** Local wall-clock defaults (can move to settings later). */
export const DEFAULT_FEED_HOUR = 8;
export const DEFAULT_FEED_MINUTE = 0;
export const DEFAULT_WALK_HOUR = 18;
export const DEFAULT_WALK_MINUTE = 0;

export interface DailyRoutinePetInput {
  id: string;
  name: string;
}

function routineIds(petId: string): { feed: string; walk: string } {
  return {
    feed: `routine-feed-${petId}`,
    walk: `routine-walk-${petId}`,
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

async function cancelAllRoutineTriggers(service: NotificationService): Promise<void> {
  try {
    const triggers = await notifee.getTriggerNotifications();
    for (const row of triggers) {
      const id = row.notification?.id;
      if (
        id != null &&
        (id.startsWith('routine-feed-') || id.startsWith('routine-walk-'))
      ) {
        await service.cancelNotification(id);
      }
    }
  } catch {
    // If native API fails, still try scheduling (may duplicate until next full sync).
  }
}

/**
 * Rebuilds daily repeating notifications for feed + walk for every pet in the list.
 * Cancels any previous routine-* triggers first (including pets that were removed).
 */
export async function syncDailyRoutineNotificationsForPets(
  pets: DailyRoutinePetInput[],
  service: NotificationService,
): Promise<void> {
  await cancelAllRoutineTriggers(service);
  const displayName = (name: string): string => name.trim() || 'your pet';

  for (const pet of pets) {
    const label = displayName(pet.name);
    const { feed, walk } = routineIds(pet.id);
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

    await service.scheduleNotification({
      id: walk,
      title: `Walk time for ${label}`,
      body: `Stretch those legs — ${label} will thank you.`,
      scheduledDate: nextLocalOccurrence(DEFAULT_WALK_HOUR, DEFAULT_WALK_MINUTE),
      repeat: 'daily',
      data: { ...baseData, routine: 'walk' },
    });
  }
}

export async function cancelDailyRoutineForPet(
  petId: string,
  service: NotificationService,
): Promise<void> {
  const { feed, walk } = routineIds(petId);
  await service.cancelNotification(feed);
  await service.cancelNotification(walk);
}
