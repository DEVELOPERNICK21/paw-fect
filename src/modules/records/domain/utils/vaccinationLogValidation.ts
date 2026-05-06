import type { SmartHealthRecord } from '../models/SmartHealthRecord';
import { calendarDaysBetweenIsoDates } from '../../../../shared/utils/calendarDate';
import { toIsoDateOnly } from './healthRecordDateGuards';

/**
 * Series doses (puppy / catch-up): one-sided window relative to scheduled `dueDate`.
 *  - exactly on due date         → ideal
 *  - +1 .. +14 days late         → acceptable
 *  - +15 .. +21 days late        → warn (accept with vet-check nudge)
 *  - +22 days or more late       → reject (series timing is at risk; vet must reassess)
 *
 * Series doses can never be logged early — the immune system needs the gap.
 */
export const VACCINE_SERIES_ACCEPTABLE_LATE_DAYS = 14;
export const VACCINE_SERIES_WARN_LATE_DAYS = 21;

/**
 * Annual boosters: symmetric ±30 day window — clinical norm at most pet
 * insurers / boarding facilities.
 *  - within ±7 days   → ideal
 *  - within ±14 days  → acceptable
 *  - within ±30 days  → warn (accept with reminder)
 *  - beyond ±30 days  → reject (reschedule the dose first)
 */
export const VACCINE_BOOSTER_IDEAL_TOLERANCE_DAYS = 7;
export const VACCINE_BOOSTER_ACCEPTABLE_TOLERANCE_DAYS = 14;
export const VACCINE_BOOSTER_MAX_TOLERANCE_DAYS = 30;

export type VaccinationLogTier = 'ideal' | 'acceptable' | 'warn';

export type VaccinationLogResult =
  | { ok: true; tier?: VaccinationLogTier; warning?: string }
  | { ok: false; error: string };

export function resolvePrerequisiteCompletedDate(
  records: readonly SmartHealthRecord[],
  dependsOn: string | null | undefined,
): string | undefined {
  if (!dependsOn) {
    return undefined;
  }
  const prior = records.find(r => r.id === dependsOn);
  if (!prior || prior.status !== 'completed' || !prior.completedDate) {
    return undefined;
  }
  return toIsoDateOnly(prior.completedDate);
}

const formatHumanDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export function validateVaccinationLogDate(input: {
  petDateOfBirth: string;
  today: string;
  selectedDate: string;
  dueDate: string;
  prerequisiteCompletedDate?: string;
  /**
   * Annual booster vaccinations use a symmetric ±30 day window.
   * Series doses (`isAnnualBooster: false` / undefined) use the strict one-sided window.
   */
  isAnnualBooster?: boolean;
}): VaccinationLogResult {
  const s = toIsoDateOnly(input.selectedDate);
  const t = toIsoDateOnly(input.today);
  const d0 = toIsoDateOnly(input.petDateOfBirth);
  const due = toIsoDateOnly(input.dueDate);

  if (s > t) {
    return { ok: false, error: 'You can only log today or a past date.' };
  }
  if (s < d0) {
    return {
      ok: false,
      error: "Date cannot be before your pet's date of birth.",
    };
  }

  if (input.prerequisiteCompletedDate) {
    const p = toIsoDateOnly(input.prerequisiteCompletedDate);
    if (s < p) {
      return {
        ok: false,
        error:
          'Log this dose on or after the date the previous dose in the series was given.',
      };
    }
  }

  if (input.isAnnualBooster) {
    const diffDays = calendarDaysBetweenIsoDates(due, s);
    const absDiff = Math.abs(diffDays);

    if (absDiff > VACCINE_BOOSTER_MAX_TOLERANCE_DAYS) {
      return {
        ok: false,
        error: `Annual boosters should be logged within ${VACCINE_BOOSTER_MAX_TOLERANCE_DAYS} days of the due date (${formatHumanDate(
          due,
        )}). Reschedule this dose if your appointment is further away.`,
      };
    }
    if (absDiff <= VACCINE_BOOSTER_IDEAL_TOLERANCE_DAYS) {
      return { ok: true, tier: 'ideal' };
    }
    if (absDiff <= VACCINE_BOOSTER_ACCEPTABLE_TOLERANCE_DAYS) {
      return { ok: true, tier: 'acceptable' };
    }
    return {
      ok: true,
      tier: 'warn',
      warning: `This booster is ${absDiff} days ${
        diffDays < 0 ? 'before' : 'after'
      } the planned date (${formatHumanDate(
        due,
      )}). It's still inside the safe window — try to align with your next vet visit.`,
    };
  }

  if (s < due) {
    return {
      ok: false,
      error: 'Vaccination cannot be logged before the scheduled due date.',
    };
  }

  const daysAfterDue = calendarDaysBetweenIsoDates(due, s);

  if (daysAfterDue > VACCINE_SERIES_WARN_LATE_DAYS) {
    return {
      ok: false,
      error: `This dose is more than ${VACCINE_SERIES_WARN_LATE_DAYS} days past the planned date (${formatHumanDate(
        due,
      )}). Please consult your vet — the series may need to be reassessed before logging.`,
    };
  }

  if (daysAfterDue > VACCINE_SERIES_ACCEPTABLE_LATE_DAYS) {
    return {
      ok: true,
      tier: 'warn',
      warning: `This dose is ${daysAfterDue} days after the planned date (${formatHumanDate(
        due,
      )}). The series timing is at the limit — confirm with your vet that the schedule is still on track.`,
    };
  }

  if (daysAfterDue === 0) {
    return { ok: true, tier: 'ideal' };
  }

  return { ok: true, tier: 'acceptable' };
}
