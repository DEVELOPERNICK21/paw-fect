import type { LifestyleType } from '../models/CarePlanTemplate';

export type DewormingSymptom =
  | 'diarrhea'
  | 'vomiting'
  | 'bloated_belly'
  | 'worms_visible';

/** Full engine input: pet context + optional onboarding + user completion history */
export interface DewormingInput {
  petType: 'dog' | 'cat';
  dateOfBirth: string;
  lifestyle: LifestyleType;
  hasPreviousDeworming?: boolean;
  lastDewormingUnknown?: boolean;
  lastDewormingDate?: string;
  completionDates?: string[];
  symptoms?: DewormingSymptom[];
  todayDate: string;
}

/** Schedule rhythm for labels and log-date window (not future). */
export type DewormingCadenceKind =
  | 'every_14_days'
  | 'monthly'
  | 'every_2_months'
  | 'every_3_months';

export interface ScheduleItem {
  id: string;
  dueDate: string;
  status: 'completed' | 'pending' | 'missed';
  originalDueDate?: string;
  /** Present on items returned from {@link DewormingEngine.execute}. */
  cadence?: DewormingCadenceKind;
}

export interface DewormingMetadata {
  riskLevel: 'low' | 'medium' | 'high';
  urgency: 'critical' | 'high' | 'medium' | 'low';
  confidence: 'high' | 'medium' | 'low';
  estimatedSchedule?: boolean;
  lastCalculatedAt: string;
}

export interface DewormingResult {
  nextStep: ScheduleItem | null;
  upcoming: ScheduleItem[];
  completed: ScheduleItem[];
  metadata: DewormingMetadata;
}

export type DewormingValidationCode = 'before_dob' | 'after_today';

export interface DewormingValidationResult {
  ok: boolean;
  code?: DewormingValidationCode;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const toIsoDateOnly = (value: string): string => value.slice(0, 10);

export const validateLastDewormingDate = (
  dateOfBirth: string,
  lastDewormingDate: string,
  todayDate: string,
): DewormingValidationResult => {
  const dob = toIsoDateOnly(dateOfBirth);
  const last = toIsoDateOnly(lastDewormingDate);
  const today = toIsoDateOnly(todayDate);
  if (last < dob) {
    return { ok: false, code: 'before_dob' };
  }
  if (last > today) {
    return { ok: false, code: 'after_today' };
  }
  return { ok: true };
};

const addDays = (date: string, days: number): string => {
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDateOnly(d.toISOString());
};

const addWeeks = (date: string, weeks: number): string =>
  addDays(date, weeks * 7);

const addMonths = (date: string, months: number): string => {
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  d.setUTCMonth(d.getUTCMonth() + months);
  return toIsoDateOnly(d.toISOString());
};

const daysBetween = (from: string, to: string): number => {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.floor((b - a) / DAY_MS);
};

const getCalendarAgeMonths = (dateOfBirth: string, asOf: string): number => {
  const [y0, m0, d0] = dateOfBirth.split('-').map(Number);
  const [y1, m1, d1] = asOf.split('-').map(Number);
  let months = (y1 - y0) * 12 + (m1 - m0);
  if (d1 < d0) {
    months -= 1;
  }
  return Math.max(0, months);
};

const generateItemId = (dueDate: string, index: number): string =>
  `deworm-${dueDate}-${index}`;

const EARLY_WEEK_MILESTONES = [2, 4, 6, 8] as const;
const GROWTH_MONTH_MILESTONES = [3, 4, 5, 6] as const;

const eightWeekDate = (dob: string): string => addWeeks(dob, 8);
const sixMonthDate = (dob: string): string => addMonths(dob, 6);

const getAgeInWeeks = (dob: string, asOf: string): number =>
  Math.floor(daysBetween(dob, asOf) / 7);

const phaseAtDate = (dob: string, d: string): 'early' | 'growth' | 'adult' => {
  const w8 = eightWeekDate(dob);
  const m6 = sixMonthDate(dob);
  if (d <= w8) {
    return 'early';
  }
  if (d < m6) {
    return 'growth';
  }
  return 'adult';
};

const adultIntervalMonthsFromLifestyle = (lifestyle: LifestyleType): number => {
  if (lifestyle === 'outdoor') {
    return 2;
  }
  if (lifestyle === 'mixed') {
    return 2;
  }
  return 3;
};

/** Classify ideal / scheduled dose by pet age phase (for UI + log window). */
export const getCadenceForDueDate = (
  dob: string,
  dueDate: string,
  lifestyle: LifestyleType,
): DewormingCadenceKind => {
  const d = toIsoDateOnly(dob);
  const due = toIsoDateOnly(dueDate);
  const w8 = eightWeekDate(d);
  const m6 = sixMonthDate(d);
  if (due <= w8) {
    return 'every_14_days';
  }
  if (due < m6) {
    return 'monthly';
  }
  return adultIntervalMonthsFromLifestyle(lifestyle) <= 2
    ? 'every_2_months'
    : 'every_3_months';
};

export const cadenceDisplayLabel = (cadence: DewormingCadenceKind): string => {
  switch (cadence) {
    case 'every_14_days':
      return 'Every 2 weeks';
    case 'monthly':
      return 'Monthly';
    case 'every_2_months':
      return 'Every 2 months';
    case 'every_3_months':
      return 'Every 3 months';
  }
};

/**
 * Earliest date the user may log for this cadence: rolling window ending today,
 * never before DOB. (14d / 1mo / 2mo / 3mo lookback from today.)
 */
export const getMinimumLogDate = (
  dob: string,
  today: string,
  cadence: DewormingCadenceKind,
): string => {
  const d0 = toIsoDateOnly(dob);
  const t = toIsoDateOnly(today);
  let windowStart: string;
  switch (cadence) {
    case 'every_14_days':
      windowStart = addDays(t, -14);
      break;
    case 'monthly':
      windowStart = addMonths(t, -1);
      break;
    case 'every_2_months':
      windowStart = addMonths(t, -2);
      break;
    case 'every_3_months':
      windowStart = addMonths(t, -3);
      break;
  }
  return windowStart > d0 ? windowStart : d0;
};

export const validateLogDateForCadence = (
  dob: string,
  today: string,
  selectedDate: string,
  cadence: DewormingCadenceKind,
): { ok: true } | { ok: false; error: string } => {
  const min = getMinimumLogDate(dob, today, cadence);
  const max = toIsoDateOnly(today);
  const s = toIsoDateOnly(selectedDate);
  if (s < toIsoDateOnly(dob)) {
    return { ok: false, error: 'Date cannot be before your pet’s date of birth.' };
  }
  if (s > max) {
    return { ok: false, error: 'You can only log today or a past date.' };
  }
  if (s < min) {
    return {
      ok: false,
      error: `For ${cadenceDisplayLabel(
        cadence,
      )} doses, choose a date within the allowed window (on or after ${min}).`,
    };
  }
  return { ok: true };
};

const attachCadence = (
  item: ScheduleItem,
  dob: string,
  lifestyle: LifestyleType,
): ScheduleItem => ({
  ...item,
  cadence: getCadenceForDueDate(dob, item.dueDate, lifestyle),
});

const buildIdealMilestoneDates = (dob: string, horizonEnd: string): string[] => {
  const dates: string[] = [];
  for (const w of EARLY_WEEK_MILESTONES) {
    dates.push(addWeeks(dob, w));
  }
  for (const m of GROWTH_MONTH_MILESTONES) {
    dates.push(addMonths(dob, m));
  }
  let adultCursor = sixMonthDate(dob);
  const cap = horizonEnd > adultCursor ? horizonEnd : addMonths(dob, 36);
  while (adultCursor <= cap) {
    dates.push(adultCursor);
    adultCursor = addMonths(adultCursor, 3);
  }
  return [...new Set(dates)].sort((a, b) => a.localeCompare(b));
};

const mergeCompletionSources = (input: DewormingInput): string[] => {
  const dob = toIsoDateOnly(input.dateOfBirth);
  const today = toIsoDateOnly(input.todayDate);
  const raw: string[] = [...(input.completionDates ?? [])];
  const last = input.lastDewormingDate;
  const validLast =
    last &&
    validateLastDewormingDate(dob, last, today).ok &&
    !input.lastDewormingUnknown;
  if (validLast && last) {
    raw.push(last);
  }
  return [...new Set(raw.map(toIsoDateOnly))].sort((a, b) => a.localeCompare(b));
};

const makeItem = (
  dueDate: string,
  today: string,
  completions: Set<string>,
  index: number,
): ScheduleItem => {
  if (completions.has(dueDate)) {
    return {
      id: generateItemId(dueDate, index),
      dueDate,
      status: 'completed',
    };
  }
  if (dueDate < today) {
    return {
      id: generateItemId(dueDate, index),
      dueDate,
      status: 'missed',
    };
  }
  return {
    id: generateItemId(dueDate, index),
    dueDate,
    status: 'pending',
  };
};

/**
 * Future (and overdue) doses after completion L — realigns from actual date, not ideal grid.
 */
const expandForwardFromCompletion = (
  L: string,
  dob: string,
  today: string,
  lifestyle: LifestyleType,
  completions: Set<string>,
  startIndex: number,
): ScheduleItem[] => {
  const out: ScheduleItem[] = [];
  let idx = startIndex;
  const m6 = sixMonthDate(dob);
  const phaseL = phaseAtDate(dob, L);

  const push = (dueDate: string): void => {
    if (dueDate <= L) {
      return;
    }
    out.push(makeItem(dueDate, today, completions, idx++));
  };

  let lastScheduled = L;

  if (phaseL === 'early') {
    let cursor = L;
    for (let n = 0; n < 16; n += 1) {
      const next = addDays(cursor, 14);
      if (next <= L) {
        cursor = next;
        continue;
      }
      if (getAgeInWeeks(dob, next) > 8) {
        break;
      }
      push(next);
      lastScheduled = next;
      cursor = next;
    }
    let gCursor = lastScheduled;
    let nextG = addMonths(gCursor, 1);
    while (nextG < m6) {
      push(nextG);
      lastScheduled = nextG;
      gCursor = nextG;
      nextG = addMonths(gCursor, 1);
    }
  } else if (phaseL === 'growth') {
    let cursor = L;
    let nextG = addMonths(cursor, 1);
    let guard = 0;
    while (nextG < m6 && guard < 24) {
      push(nextG);
      lastScheduled = nextG;
      cursor = nextG;
      nextG = addMonths(cursor, 1);
      guard += 1;
    }
  }

  const step = adultIntervalMonthsFromLifestyle(lifestyle);
  let adultAnchor: string;
  if (phaseL === 'adult' || L >= m6) {
    adultAnchor = L;
  } else {
    adultAnchor = lastScheduled > L ? lastScheduled : m6;
  }

  let nextA = addMonths(adultAnchor, step);
  if (nextA <= L) {
    nextA = addMonths(L, step);
  }
  const horizon = addMonths(today, 24);
  let guard = 0;
  while (nextA <= horizon && guard < 40) {
    push(nextA);
    nextA = addMonths(nextA, step);
    guard += 1;
  }

  return out;
};

const collectActionableItems = (
  dob: string,
  today: string,
  lifestyle: LifestyleType,
  completions: Set<string>,
): ScheduleItem[] => {
  const horizonEnd = addMonths(today, 36);
  const ideal = buildIdealMilestoneDates(dob, horizonEnd);
  const sortedC = [...completions].sort((a, b) => a.localeCompare(b));
  const lastC = sortedC.length ? sortedC[sortedC.length - 1] : null;

  const map = new Map<string, ScheduleItem>();
  let index = 0;

  if (!lastC) {
    for (const due of ideal) {
      const it = makeItem(due, today, completions, index++);
      if (it.status !== 'completed') {
        map.set(due, it);
      }
    }
    return [...map.values()].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  for (const due of ideal) {
    if (due > lastC) {
      continue;
    }
    if (completions.has(due)) {
      continue;
    }
    const it = makeItem(due, today, completions, index++);
    map.set(due, it);
  }

  const forward = expandForwardFromCompletion(
    lastC,
    dob,
    today,
    lifestyle,
    completions,
    index,
  );
  for (const it of forward) {
    if (it.status === 'completed') {
      continue;
    }
    const existing = map.get(it.dueDate);
    if (!existing || existing.status !== 'missed') {
      map.set(it.dueDate, it);
    }
  }

  return [...map.values()].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
};

const buildCompletedItems = (completions: Set<string>): ScheduleItem[] => {
  const sorted = [...completions].sort((a, b) => b.localeCompare(a));
  return sorted.map((dueDate, i) => ({
    id: generateItemId(dueDate, i),
    dueDate,
    status: 'completed' as const,
  }));
};

const computeConfidence = (
  input: DewormingInput,
): { confidence: DewormingMetadata['confidence']; estimated: boolean } => {
  const dob = toIsoDateOnly(input.dateOfBirth);
  const today = toIsoDateOnly(input.todayDate);
  const ageMonths = getCalendarAgeMonths(dob, today);
  const validLast =
    input.lastDewormingDate &&
    validateLastDewormingDate(dob, input.lastDewormingDate, today).ok;

  if (input.lastDewormingUnknown) {
    return { confidence: 'low', estimated: true };
  }
  if (validLast) {
    return { confidence: 'high', estimated: false };
  }
  if (input.hasPreviousDeworming && !input.lastDewormingDate) {
    return { confidence: 'low', estimated: true };
  }
  if (ageMonths >= 6 && !validLast && !(input.completionDates?.length ?? 0)) {
    return { confidence: 'low', estimated: true };
  }
  if (ageMonths < 6) {
    return { confidence: 'medium', estimated: false };
  }
  return { confidence: 'medium', estimated: false };
};

export class DewormingEngine {
  execute(input: DewormingInput): DewormingResult {
    const today = toIsoDateOnly(input.todayDate);
    const lifestyle = input.lifestyle;
    const symptoms = input.symptoms ?? [];
    const hasSymptoms = symptoms.length > 0;

    const completions = mergeCompletionSources(input);
    const completionSet = new Set(completions);
    const noLoggedCompletions = completionSet.size === 0;

    const dob = toIsoDateOnly(input.dateOfBirth);

    const actionable = collectActionableItems(
      dob,
      today,
      lifestyle,
      completionSet,
    );
    const pending = actionable.filter(i => i.status === 'pending');
    const missed = actionable
      .filter(i => i.status === 'missed')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const completed = buildCompletedItems(completionSet);

    let nextStep: ScheduleItem | null = null;
    let urgency: DewormingMetadata['urgency'] = 'low';
    let riskLevel: DewormingMetadata['riskLevel'] = 'low';

    if (missed.length > 0 || pending.length > 0) {
      const primary = noLoggedCompletions
        ? pending[0] ?? missed[0] ?? null
        : missed[0] ?? pending[0] ?? null;
      if (primary) {
        nextStep = attachCadence({ ...primary }, dob, lifestyle);
        if (hasSymptoms) {
          urgency = 'critical';
          riskLevel = 'high';
        } else if (primary.status === 'missed') {
          const daysOverdue = daysBetween(primary.dueDate, today);
          urgency = daysOverdue > 15 ? 'critical' : 'high';
          riskLevel = daysOverdue > 15 ? 'high' : 'medium';
        } else {
          const daysUntil = daysBetween(today, primary.dueDate);
          if (daysUntil <= 0) {
            urgency = 'high';
            riskLevel = 'medium';
          } else if (daysUntil <= 7) {
            urgency = 'medium';
            riskLevel = lifestyle === 'outdoor' ? 'medium' : 'low';
          } else {
            urgency = 'low';
            riskLevel = lifestyle === 'outdoor' ? 'medium' : 'low';
          }
        }
      }
    }

    const nextDue = nextStep?.dueDate;
    const upcoming = pending
      .filter(p => nextDue && p.dueDate > nextDue)
      .slice(0, 3)
      .map(p => attachCadence(p, dob, lifestyle));

    const { confidence, estimated } = computeConfidence(input);

    return {
      nextStep,
      upcoming,
      completed,
      metadata: {
        riskLevel,
        urgency,
        confidence,
        estimatedSchedule: estimated,
        lastCalculatedAt: today,
      },
    };
  }

  recalculateAfterUpdate(input: {
    completedDate: string;
    dateOfBirth: string;
    lifestyle: LifestyleType;
    previousItems: ScheduleItem[];
    todayDate: string;
    completionDates?: string[];
  }): DewormingResult {
    const merged = new Set(
      [
        ...(input.completionDates ?? []),
        input.completedDate,
        ...input.previousItems
          .filter(i => i.status === 'completed')
          .map(i => i.dueDate),
      ].map(toIsoDateOnly),
    );
    return this.execute({
      petType: 'dog',
      dateOfBirth: input.dateOfBirth,
      lifestyle: input.lifestyle,
      todayDate: input.todayDate,
      completionDates: [...merged],
    });
  }
}

export const dewormingEngine = new DewormingEngine();
