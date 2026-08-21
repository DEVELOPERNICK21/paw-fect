import type { Pet } from '../../../pets/domain/models/Pet';
import type { Reminder } from '../../../reminders/domain/models/Reminder';
import type { ReminderType } from '../../../reminders/domain/models/Reminder';
import type { HealthRecord } from '../../../records/domain/models/HealthRecord';
import type { SmartHealthRecord } from '../../../records/domain/models/SmartHealthRecord';
import type {
  HomeDashboardAttentionBanner,
  HomeDashboardNextMilestone,
  HomeDashboardTodayCareItem,
  HomeDashboardWeekCareItem,
  HomeDashboardActionHealthItem,
  HomeDashboardViewModel,
} from '../models/HomeDashboardViewModel';
import {
  addDaysToYmd,
  formatMilestoneCountdownBadge,
  formatMilestoneDateLong,
  formatMilestoneSubtitle,
  isReminderTimeInPastForToday,
  parseLocalDay,
  reminderDateKey,
  toYmd,
} from '../utils/homeDashboardDates';
import { getLatestWeightDisplayForPet } from '../../../../shared/utils/healthRecordWeight';

export interface BuildHomeDashboardViewModelInput {
  now: Date;
  petsLoading: boolean;
  pets: Pet[];
  activePet: Pet | null;
  reminders: Reminder[];
  remindersLoading: boolean;
  records: HealthRecord[];
  smartHealthRecords: SmartHealthRecord[];
  lastError?: string | null;
  isRefreshing?: boolean;
}

const CARE_MILESTONE_STATUSES = new Set<SmartHealthRecord['status']>([
  'upcoming',
  'overdue',
  'missed',
  'locked',
]);

function pickClosestVaccinationOrDeworming(
  records: SmartHealthRecord[],
): SmartHealthRecord | null {
  const candidates = records.filter(
    r =>
      (r.type === 'vaccination' || r.type === 'deworming') &&
      CARE_MILESTONE_STATUSES.has(r.status),
  );
  if (candidates.length === 0) {
    return null;
  }
  return (
    [...candidates].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null
  );
}

function nextCareMilestoneDisplayLine(
  record: SmartHealthRecord | null,
  now: Date,
): string {
  if (record == null) {
    return '—';
  }
  const when = formatMilestoneSubtitle(record.dueDate, now);
  return `${record.name} · ${when}`;
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

function lastLoggedDateLineForPet(
  records: HealthRecord[],
  petId: string,
): string {
  const latestDate = latestRecordDateForPet(records, petId);
  if (latestDate == null) {
    return '—';
  }
  return parseLocalDay(reminderDateKey(latestDate)).toLocaleDateString(
    undefined,
    { month: 'short', day: 'numeric' },
  );
}

function lastActivityLineForPet(
  records: HealthRecord[],
  petId: string,
): string {
  const petRecords = records.filter(r => r.petId === petId);
  if (petRecords.length === 0) {
    return 'No logs yet';
  }
  const latest = [...petRecords].sort((a, b) => b.date.localeCompare(a.date))[0]!;
  const short = lastLoggedDateLineForPet(records, petId);
  return `${latest.title} · ${short}`;
}

type WeekCareCandidate = {
  dateKey: string;
  tie: string;
  id: string;
  title: string;
  subtitle: string;
  kind: HomeDashboardWeekCareItem['kind'];
  reminderType?: ReminderType;
};

function buildAttentionBanner(
  todayKey: string,
  petReminders: Reminder[],
  petSmartRecords: SmartHealthRecord[],
): HomeDashboardAttentionBanner {
  const overdueSmart = petSmartRecords.filter(
    r => r.status === 'overdue' || r.status === 'missed',
  ).length;
  const pastReminders = petReminders.filter(
    r => reminderDateKey(r.date) < todayKey,
  ).length;
  const n = overdueSmart + pastReminders;
  if (n <= 0) {
    return {
      show: false,
      headline: '',
      subline: '',
    };
  }
  return {
    show: true,
    headline: n === 1 ? '1 item needs attention' : `${n} items need attention`,
    subline: 'Review health records, vaccines, and reminders.',
  };
}

function buildActionHealthItems(
  records: SmartHealthRecord[],
  now: Date,
): HomeDashboardActionHealthItem[] {
  return records
    .filter(
      r =>
        (r.type === 'vaccination' || r.type === 'deworming') &&
        (r.status === 'overdue' ||
          r.status === 'upcoming' ||
          r.status === 'missed'),
    )
    .slice()
    .sort((a, b) => {
      const aOverdue = a.status === 'overdue' || a.status === 'missed';
      const bOverdue = b.status === 'overdue' || b.status === 'missed';
      if (aOverdue && !bOverdue) {
        return -1;
      }
      if (bOverdue && !aOverdue) {
        return 1;
      }
      return a.dueDate.localeCompare(b.dueDate);
    })
    .slice(0, 4)
    .map(r => ({
      id: r.id,
      title: r.name,
      kind: r.type,
      dueDateLabel: formatMilestoneDateLong(r.dueDate),
      countdownLabel: formatMilestoneCountdownBadge(r.dueDate, now),
      urgency:
        r.status === 'overdue' || r.status === 'missed' ? 'overdue' : 'upcoming',
    }));
}

function buildWeekCarePreview(
  now: Date,
  todayKey: string,
  petReminders: Reminder[],
  petSmartRecords: SmartHealthRecord[],
): HomeDashboardWeekCareItem[] {
  const weekLastKey = addDaysToYmd(todayKey, 7);
  const inWindow = (dateKey: string): boolean =>
    dateKey >= todayKey && dateKey <= weekLastKey;

  const cands: WeekCareCandidate[] = [];

  for (const r of petSmartRecords) {
    if (!CARE_MILESTONE_STATUSES.has(r.status)) {
      continue;
    }
    const dk = reminderDateKey(r.dueDate);
    if (!inWindow(dk)) {
      continue;
    }
    cands.push({
      dateKey: dk,
      tie: '00:00',
      id: `smart-${r.id}`,
      title: r.name,
      subtitle: formatMilestoneSubtitle(r.dueDate, now),
      kind: r.type === 'vaccination' ? 'vaccination' : 'deworming',
    });
  }

  for (const r of petReminders) {
    const dk = reminderDateKey(r.date);
    if (!inWindow(dk)) {
      continue;
    }
    cands.push({
      dateKey: dk,
      tie: r.time.trim().length > 0 ? r.time : '12:00',
      id: `rem-${r.id}`,
      title: r.title,
      subtitle: formatMilestoneSubtitle(r.date, now),
      kind: 'reminder',
      reminderType: r.type,
    });
  }

  cands.sort((a, b) => {
    const c = a.dateKey.localeCompare(b.dateKey);
    if (c !== 0) {
      return c;
    }
    return a.tie.localeCompare(b.tie);
  });

  return cands.slice(0, 6).map(
    ({ id, title, subtitle, kind, reminderType }): HomeDashboardWeekCareItem => ({
      id,
      title,
      subtitle,
      kind,
      reminderType,
    }),
  );
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
      smartHealthRecords,
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

    const latestRecordDate =
      activePet != null
        ? latestRecordDateForPet(records, activePet.id)
        : undefined;

    const healthStatusLine = healthStatusFromLastRecordDate(
      latestRecordDate,
      nowMs,
    );

    const petSmartRecords =
      activePet != null
        ? smartHealthRecords.filter(r => r.petId === activePet.id)
        : [];
    const nextCareRecord = pickClosestVaccinationOrDeworming(petSmartRecords);
    const nextCareMilestoneLine = nextCareMilestoneDisplayLine(
      nextCareRecord,
      now,
    );

    const nextMilestone: HomeDashboardNextMilestone | null =
      nextCareRecord == null
        ? null
        : {
            title: nextCareRecord.name,
            dueDateYmd: reminderDateKey(nextCareRecord.dueDate),
            dueDateLabel: formatMilestoneDateLong(nextCareRecord.dueDate),
            countdownLabel: formatMilestoneCountdownBadge(
              nextCareRecord.dueDate,
              now,
            ),
            kind: nextCareRecord.type,
          };

    const lastActivityLine =
      activePet != null
        ? lastActivityLineForPet(records, activePet.id)
        : '—';
    const lastLoggedDateLine =
      activePet != null
        ? lastLoggedDateLineForPet(records, activePet.id)
        : '—';

    const attentionBanner = buildAttentionBanner(
      todayKey,
      petReminders,
      petSmartRecords,
    );

    const weekCarePreview = buildWeekCarePreview(
      now,
      todayKey,
      petReminders,
      petSmartRecords,
    );
    const actionHealthItems = buildActionHealthItems(petSmartRecords, now);

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
      nextCareMilestoneLine,
      nextMilestone,
      lastActivityLine,
      lastLoggedDateLine,
      weightLine,
      activityLine: '—',
      heartLine: '—',
      attentionBanner,
      todayCare,
      weekCarePreview,
      actionHealthItems,
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
    nextCareMilestoneLine: '—',
    nextMilestone: null,
    lastActivityLine: '—',
    lastLoggedDateLine: '—',
    weightLine: '—',
    activityLine: '—',
    heartLine: '—',
    attentionBanner: { show: false, headline: '', subline: '' },
    todayCare: [],
    weekCarePreview: [],
    actionHealthItems: [],
    lastError: null,
    isRefreshing: false,
  };
}
