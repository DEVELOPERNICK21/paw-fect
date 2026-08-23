import type { ActivationReminderKind, ReminderDraft } from './OnboardingDraft';
import { addDaysToYmd, toYmd } from '../utils/homeDashboardDates';

/** Calendar date (YYYY-MM-DD) in the user's local timezone. */
export function toLocalIsoDate(date: Date): string {
  return toYmd(date);
}

/** Add whole calendar days to a Date, returning local YYYY-MM-DD. */
export function addDaysLocalIsoDate(date: Date, days: number): string {
  const today = toLocalIsoDate(date);
  return addDaysToYmd(today, days);
}

export function buildReminderDraftDefaults(
  kind: ActivationReminderKind,
  nickname: string,
  now: Date = new Date(),
): ReminderDraft {
  switch (kind) {
    case 'walk':
      return {
        kind: 'walk',
        title: `${nickname}'s walk`,
        date: addDaysLocalIsoDate(now, 1),
        time: '08:00',
        repeat: 'daily',
        reminderType: 'other',
      };
    case 'vaccination':
      return {
        kind: 'vaccination',
        title: `${nickname}'s vaccination`,
        date: addDaysLocalIsoDate(now, 28),
        time: '09:00',
        repeat: 'yearly',
        reminderType: 'vaccination',
      };
    case 'medication':
      return {
        kind: 'medication',
        title: `${nickname}'s medication`,
        date: addDaysLocalIsoDate(now, 1),
        time: '08:00',
        repeat: 'once',
        reminderType: 'medication',
      };
    case 'checkup':
      return {
        kind: 'checkup',
        title: `${nickname}'s checkup`,
        date: addDaysLocalIsoDate(now, 365),
        time: '09:00',
        repeat: 'yearly',
        reminderType: 'checkup',
      };
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
