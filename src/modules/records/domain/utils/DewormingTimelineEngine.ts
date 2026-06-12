import { isValidDate } from '../../../../shared/utils/calendarDate';

export type DewormingEventStatus =
  | 'UPCOMING'
  | 'OVERDUE'
  | 'COMPLETED'
  | 'SKIPPED';

export type DewormingEventSource = 'system' | 'history';

export interface DewormingTimelinePetInput {
  id: string;
  dateOfBirth: string;
  onboardingDate: string;
}

export interface DewormingHistoryEntry {
  date: string; // YYYY-MM-DD
  type: 'completed' | 'skipped';
  reason?: string;
}

export interface DewormingTimelineEvent {
  id: string;
  date: string; // YYYY-MM-DD
  status: DewormingEventStatus;
  source: DewormingEventSource;
  reason?: string;
}

export interface DewormingTimelineSections {
  nextStep: DewormingTimelineEvent | null;
  comingUp: DewormingTimelineEvent[];
  history: DewormingTimelineEvent[];
}

const FUTURE_EVENT_LIMIT = 10;

const toIso = (value: string): string => value.slice(0, 10);

const safeToIsoDate = (d: Date, fallback: string): string => {
  if (!isValidDate(d)) {
    return toIso(fallback);
  }
  return d.toISOString().slice(0, 10);
};

const addDays = (date: string, days: number): string => {
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  d.setUTCDate(d.getUTCDate() + days);
  return safeToIsoDate(d, date);
};

const addMonths = (date: string, months: number): string => {
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  d.setUTCMonth(d.getUTCMonth() + months);
  return safeToIsoDate(d, date);
};

const maxDate = (a: string, b: string): string => (a > b ? a : b);

const stageAtDate = (
  dob: string,
  date: string,
): 'early_puppy' | 'puppy_monthly' | 'adult_quarterly' => {
  const at3m = addMonths(dob, 3);
  const at6m = addMonths(dob, 6);
  if (date < at3m) return 'early_puppy';
  if (date < at6m) return 'puppy_monthly';
  return 'adult_quarterly';
};

const nextDateByCadence = (anchorDate: string, dob: string): string => {
  const stage = stageAtDate(dob, anchorDate);
  if (stage === 'early_puppy') return addDays(anchorDate, 14);
  if (stage === 'puppy_monthly') return addMonths(anchorDate, 1);
  return addMonths(anchorDate, 3);
};

const uniqueHistory = (
  history: DewormingHistoryEntry[],
): DewormingHistoryEntry[] => {
  const sorted = history
    .map(item => ({
      ...item,
      date: toIso(item.date),
      reason: item.reason?.trim() || undefined,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const seen = new Set<string>();
  const out: DewormingHistoryEntry[] = [];
  for (const item of sorted) {
    const key = `${item.date}:${item.type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
};

export function generateDewormingTimeline(
  pet: DewormingTimelinePetInput,
  history: DewormingHistoryEntry[],
  today: string,
): DewormingTimelineEvent[] {
  const dob = toIso(pet.dateOfBirth);
  const onboarding = toIso(pet.onboardingDate);
  const todayIso = toIso(today);
  const validStartingAgeDate = addDays(dob, 14);
  const startFrom = maxDate(onboarding, validStartingAgeDate);

  const cleanedHistory = uniqueHistory(history).filter(item => item.date >= dob);
  const completed = cleanedHistory.filter(item => item.type === 'completed');
  const latestCompleted = completed[completed.length - 1];
  const latestHistory = cleanedHistory[cleanedHistory.length - 1];

  let seedDate = latestCompleted?.date ?? startFrom;
  const events: DewormingTimelineEvent[] = cleanedHistory.map((item, index) => ({
    id: `history-${item.date}-${item.type}-${index}`,
    date: item.date,
    status: item.type === 'completed' ? 'COMPLETED' : 'SKIPPED',
    source: 'history',
    reason: item.reason,
  }));

  if (latestHistory?.date) {
    seedDate = maxDate(seedDate, latestHistory.date);
  }

  const hasHistory = cleanedHistory.length > 0;
  let cursor = hasHistory ? nextDateByCadence(seedDate, dob) : seedDate;
  const generated: DewormingTimelineEvent[] = [];
  const floor = maxDate(startFrom, dob);
  let guard = 0;
  const horizon = addMonths(todayIso, 24);
  while (guard < 80) {
    guard += 1;
    if (cursor < floor) {
      cursor = nextDateByCadence(floor, dob);
      continue;
    }
    const status: DewormingEventStatus = cursor < todayIso ? 'OVERDUE' : 'UPCOMING';
    generated.push({
      id: `system-${cursor}`,
      date: cursor,
      status,
      source: 'system',
    });
    if (generated.filter(item => item.status === 'UPCOMING').length >= FUTURE_EVENT_LIMIT) {
      break;
    }
    if (cursor > horizon) {
      break;
    }
    cursor = nextDateByCadence(cursor, dob);
  }

  return [...events, ...generated].sort((a, b) => a.date.localeCompare(b.date));
}

export function projectDewormingTimelineSections(
  timeline: DewormingTimelineEvent[],
): DewormingTimelineSections {
  const history = timeline
    .filter(item => item.source === 'history')
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  const actionable = timeline
    .filter(item => item.status === 'OVERDUE' || item.status === 'UPCOMING')
    .slice()
    .sort((a, b) => {
      if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1;
      if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1;
      return a.date.localeCompare(b.date);
    });

  const nextStep = actionable[0] ?? null;
  const comingUp = actionable
    .filter(item => item.id !== nextStep?.id)
    .filter(item => item.status === 'UPCOMING')
    .slice(0, 4);

  return { nextStep, comingUp, history };
}
