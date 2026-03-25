import type { Pet } from '../../../pets/domain/models/Pet';
import type { Reminder } from '../../../reminders/domain/models/Reminder';
import type { HealthRecord } from '../../../records/domain/models/HealthRecord';
import type {
  HomeDashboardTodayCareItem,
  HomeDashboardUpcomingItem,
  HomeDashboardViewModel,
} from '../models/HomeDashboardViewModel';
import {
  formatMilestoneSubtitle,
  isReminderTimeInPastForToday,
  parseLocalDay,
  reminderDateKey,
  toYmd,
} from '../utils/homeDashboardDates';
import { getLatestWeightDisplayForPet } from '../../../../shared/utils/healthRecordWeight';

const MEAL_HINT = /meal|feed|breakfast|lunch|dinner|snack|food/i;

export interface BuildHomeDashboardViewModelInput {
  now: Date;
  petsLoading: boolean;
  pets: Pet[];
  activePet: Pet | null;
  reminders: Reminder[];
  remindersLoading: boolean;
  records: HealthRecord[];
  lastError?: string | null;
  isRefreshing?: boolean;
}

function pickNextMealReminder(todayReminders: Reminder[]): Reminder | null {
  if (todayReminders.length === 0) {
    return null;
  }
  const mealFirst = todayReminders.find(r => MEAL_HINT.test(r.title));
  const sorted = [...todayReminders].sort((a, b) =>
    a.time.localeCompare(b.time),
  );
  return mealFirst ?? sorted[0] ?? null;
}

function nextMealDisplayLine(reminder: Reminder | null): string {
  if (!reminder) {
    return '—';
  }
  const t = reminder.time.trim();
  return t.length > 0 ? t : 'All day';
}

function healthStatusFromLastRecordDate(
  latestRecordIsoDate: string | undefined,
  nowMs: number,
): string {
  if (!latestRecordIsoDate) {
    return 'No data yet';
  }
  const d = parseLocalDay(reminderDateKey(latestRecordIsoDate));
  if (Number.isNaN(d.getTime())) {
    return 'No data yet';
  }
  const diffDays = Math.floor((nowMs - d.getTime()) / 86_400_000);
  if (diffDays <= 14) {
    return 'Excellent';
  }
  if (diffDays <= 45) {
    return 'Good';
  }
  return 'Check in';
}

function latestRecordDateForPet(
  records: HealthRecord[],
  petId: string,
): string | undefined {
  const petRecords = records.filter(r => r.petId === petId);
  if (petRecords.length === 0) {
    return undefined;
  }
  const sorted = [...petRecords].sort((a, b) => b.date.localeCompare(a.date));
  return sorted[0]?.date;
}

/**
 * Pure use case: maps SSOT snapshots from pets / reminders / health records into one dashboard read model.
 */
export class BuildHomeDashboardViewModel {
  execute(input: BuildHomeDashboardViewModelInput): HomeDashboardViewModel {
    const {
      now,
      petsLoading,
      pets,
      activePet,
      reminders,
      remindersLoading,
      records,
      lastError = null,
      isRefreshing = false,
    } = input;

    const todayKey = toYmd(now);
    const nowMs = now.getTime();

    const petReminders = activePet
      ? reminders.filter(r => r.petId === activePet.id)
      : [];

    const todaySorted = [
      ...petReminders.filter(r => reminderDateKey(r.date) === todayKey),
    ].sort((a, b) => a.time.localeCompare(b.time));

    const todayCare: HomeDashboardTodayCareItem[] = todaySorted.map(
      reminder => ({
        reminder,
        showCompletedCheck: isReminderTimeInPastForToday(
          reminder.date,
          reminder.time,
          now,
        ),
      }),
    );

    const upcomingRaw = petReminders
      .filter(r => reminderDateKey(r.date) > todayKey)
      .sort((a, b) => {
        const dc = reminderDateKey(a.date).localeCompare(
          reminderDateKey(b.date),
        );
        if (dc !== 0) {
          return dc;
        }
        return a.time.localeCompare(b.time);
      })
      .slice(0, 12);

    const upcoming: HomeDashboardUpcomingItem[] = upcomingRaw.map(reminder => ({
      reminder,
      milestoneSubtitle: formatMilestoneSubtitle(reminder.date, now),
    }));

    const latestRecordDate =
      activePet != null
        ? latestRecordDateForPet(records, activePet.id)
        : undefined;

    const healthStatusLine = healthStatusFromLastRecordDate(
      latestRecordDate,
      nowMs,
    );

    const mealReminder = pickNextMealReminder(todaySorted);
    const nextMealLine = nextMealDisplayLine(mealReminder);

    const weightLine =
      activePet != null
        ? getLatestWeightDisplayForPet(records, activePet.id)
        : '—';

    return {
      now: now.toISOString(),
      petsLoading,
      remindersLoading,
      hasAnyPet: pets.length > 0,
      activePet,
      healthStatusLine,
      nextMealLine,
      weightLine,
      activityLine: '—',
      heartLine: '—',
      todayCare,
      upcoming,
      lastError,
      isRefreshing,
    };
  }
}

/** Empty dashboard when there is no signed-in user (orchestrator sets this on logout). */
export function createLoggedOutHomeDashboardViewModel(): HomeDashboardViewModel {
  return {
    now: new Date().toISOString(),
    petsLoading: false,
    remindersLoading: false,
    hasAnyPet: false,
    activePet: null,
    healthStatusLine: 'No data yet',
    nextMealLine: '—',
    weightLine: '—',
    activityLine: '—',
    heartLine: '—',
    todayCare: [],
    upcoming: [],
    lastError: null,
    isRefreshing: false,
  };
}
