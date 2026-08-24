import { parseLocalDay } from '../utils/homeDashboardDates';

import type { PetDraft, ReminderDraft } from './OnboardingDraft';

export function isPetBasicsStepValid(pet: PetDraft): boolean {
  return (
    pet.nickname.trim().length > 0 &&
    (pet.species === 'dog' || pet.species === 'cat')
  );
}

export function isFirstReminderStepValid(
  reminder: ReminderDraft | null,
): boolean {
  return Boolean(
    reminder?.kind &&
      reminder.title.trim() &&
      reminder.date &&
      reminder.time,
  );
}

export function formatActivationReminderSummary(draft: ReminderDraft): string {
  const dateLabel = parseLocalDay(draft.date).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
  const [hourPart, minutePart] = draft.time.split(':').map(Number);
  const timeDate = new Date();
  timeDate.setHours(hourPart ?? 0, minutePart ?? 0, 0, 0);
  const timeLabel = timeDate.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${dateLabel} at ${timeLabel}`;
}
