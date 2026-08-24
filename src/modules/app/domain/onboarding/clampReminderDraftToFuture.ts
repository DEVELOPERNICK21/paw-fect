import type { ReminderDraft } from './OnboardingDraft';
import { addDaysLocalIsoDate } from './buildReminderDraftDefaults';

const DEFAULT_CLAMP_TIME = '08:00';

function parseLocalDateTime(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

/** Ensures reminder draft schedules strictly in the future (local time). */
export function clampReminderDraftToFuture(
  draft: ReminderDraft,
  now: Date = new Date(),
): ReminderDraft {
  const scheduledAt = parseLocalDateTime(draft.date, draft.time);
  if (scheduledAt.getTime() > now.getTime()) {
    return draft;
  }

  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const tomorrowAtEight = parseLocalDateTime(
    addDaysLocalIsoDate(now, 1),
    DEFAULT_CLAMP_TIME,
  );
  const clampedAt =
    tomorrowAtEight.getTime() > oneHourLater.getTime()
      ? tomorrowAtEight
      : oneHourLater;

  const year = clampedAt.getFullYear();
  const month = String(clampedAt.getMonth() + 1).padStart(2, '0');
  const day = String(clampedAt.getDate()).padStart(2, '0');
  const hour = String(clampedAt.getHours()).padStart(2, '0');
  const minute = String(clampedAt.getMinutes()).padStart(2, '0');

  return {
    ...draft,
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  };
}
