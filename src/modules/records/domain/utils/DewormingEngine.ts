import { calendarDaysBetweenIsoDates } from '../../../../shared/utils/calendarDate';
import type { DewormingRule, LifestyleType } from '../models/CarePlanTemplate';
import { CARE_PLAN_TEMPLATES } from '../models/CarePlanTemplates';

type DewormPetType = 'dog' | 'cat';

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

const toIsoDateOnly = (value: string): string => value.slice(0, 10);

/** Minimum age (calendar days after DOB) before protocol-first deworm logs — aligns early milestones with vet schedules. */
export const MIN_DEWORM_AGE_DAYS = 14;

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

const getDewormingRule = (petType: DewormPetType): DewormingRule =>
  CARE_PLAN_TEMPLATES[petType].deworming;

const lifestyleIntervalDays = (
  rule: DewormingRule,
  lifestyle: LifestyleType,
): number => {
  if (lifestyle === 'outdoor') {
    return rule.outdoorIntervalDays;
  }
  if (lifestyle === 'mixed') {
    return rule.mixedIntervalDays;
  }
  return rule.indoorIntervalDays;
};

/** Last early-phase week from template `startWeeks` (typically week 8). */
const earlyPhaseEndWeeks = (rule: DewormingRule): number =>
  Math.max(...rule.startWeeks);

const earlyPhaseEndDate = (dob: string, rule: DewormingRule): string =>
  addWeeks(dob, earlyPhaseEndWeeks(rule));

/** Adult phase starts at template `untilMonths` (typically 6). */
const adultStartDate = (dob: string, rule: DewormingRule): string =>
  addMonths(dob, rule.untilMonths);

/** Growth monthly milestones from month 3 through `untilMonths` inclusive. */
const growthMonthMilestones = (rule: DewormingRule): number[] => {
  const months: number[] = [];
  for (let month = 3; month <= rule.untilMonths; month += 1) {
    months.push(month);
  }
  return months;
};

const getAgeInWeeks = (dob: string, asOf: string): number =>
  Math.floor(calendarDaysBetweenIsoDates(dob, asOf) / 7);

const phaseAtDate = (
  dob: string,
  d: string,
  rule: DewormingRule,
): 'early' | 'growth' | 'adult' => {
  const earlyEnd = earlyPhaseEndDate(dob, rule);
  const adultStart = adultStartDate(dob, rule);
  if (d <= earlyEnd) {
    return 'early';
  }
  if (d < adultStart) {
    return 'growth';
  }
  return 'adult';
};

/**
 * Adult interval in whole months from CARE_PLAN_TEMPLATES.
 * Lifestyle day fields drive outdoor/mixed; indoor uses `adultIntervalMonths`.
 */
export const adultIntervalMonthsFromLifestyle = (
  petType: DewormPetType,
  lifestyle: LifestyleType,
): number => {
  const rule = getDewormingRule(petType);
  if (lifestyle === 'indoor') {
    return rule.adultIntervalMonths;
  }
  const days = lifestyleIntervalDays(rule, lifestyle);
  const fromDays = Math.max(1, Math.round(days / 30));
  return Math.min(fromDays, rule.adultIntervalMonths);
};

const adultCadenceFromMonths = (months: number): DewormingCadenceKind => {
  if (months <= 1) {
    return 'monthly';
  }
  if (months <= 2) {
    return 'every_2_months';
  }
  return 'every_3_months';
};

/** Classify ideal / scheduled dose by pet age phase (for UI + log window). */
export const getCadenceForDueDate = (
  dob: string,
  dueDate: string,
  lifestyle: LifestyleType,
  petType: DewormPetType = 'dog',
): DewormingCadenceKind => {
  const d = toIsoDateOnly(dob);
  const due = toIsoDateOnly(dueDate);
  const rule = getDewormingRule(petType);
  const earlyEnd = earlyPhaseEndDate(d, rule);
  const adultStart = adultStartDate(d, rule);
  if (due <= earlyEnd) {
    return 'every_14_days';
  }
  if (due < adultStart) {
    return 'monthly';
  }
  return adultCadenceFromMonths(
    adultIntervalMonthsFromLifestyle(petType, lifestyle),
  );
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
 * Validates a log date using the completion history.
 * Uses the last completion date (or earliest pending due date) as baseline.
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

const calculateFirstDueDateRaw = (
  dob: string,
  cadence: DewormingCadenceKind,
): { min: string; max: string; due: string } => {
  let min: string;
  let max: string;
  let due: string;

  switch (cadence) {
    case 'every_14_days':
      due = addWeeks(dob, 2);
      min = addWeeks(dob, 1);
      max = addWeeks(dob, 3);
      break;
    case 'monthly':
      due = addMonths(dob, 2);
      min = addMonths(dob, 1);
      max = addMonths(dob, 3);
      break;
    case 'every_2_months':
      due = addMonths(dob, 3);
      min = addMonths(dob, 2);
      max = addMonths(dob, 4);
      break;
    case 'every_3_months':
      due = addMonths(dob, 6);
      min = addMonths(dob, 4);
      max = addMonths(dob, 8);
      break;
  }

  return { min, max, due };
};

const calculateFirstDueDate = (
  dob: string,
  cadence: DewormingCadenceKind,
  today: string,
): { min: string; max: string; display: string } => {
  const d0 = toIsoDateOnly(dob);
  const t = toIsoDateOnly(today);
  const raw = calculateFirstDueDateRaw(dob, cadence);

  let windowStart = raw.min;
  let windowEnd = raw.max;

  if (windowEnd > t) {
    windowEnd = t;
  }
  if (windowStart > t) {
    windowStart = t;
  }
  if (windowStart < d0) {
    windowStart = d0;
  }
  const protocolMin = addDays(d0, MIN_DEWORM_AGE_DAYS);
  if (windowStart < protocolMin) {
    windowStart = protocolMin;
  }
  if (windowEnd < windowStart) {
    windowEnd = windowStart;
  }

  return {
    min: windowStart,
    max: windowEnd,
    display: formatDisplayDate(raw.due),
  };
};

const formatDisplayDate = (isoDate: string): string => {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const validateNotBeforeDOB = (
  selected: string,
  dob: string,
): { ok: true } | { ok: false; error: string } => {
  if (selected < dob) {
    return {
      ok: false,
      error: "Date cannot be before your pet's date of birth.",
    };
  }
  return { ok: true };
};

const validateNotFuture = (
  selected: string,
  today: string,
): { ok: true } | { ok: false; error: string } => {
  if (selected > today) {
    return { ok: false, error: 'You can only log today or a past date.' };
  }
  return { ok: true };
};

const validateFirstDose = (
  selected: string,
  dob: string,
  today: string,
  cadence: DewormingCadenceKind,
): { ok: true } | { ok: false; error: string } => {
  const firstDue = calculateFirstDueDate(dob, cadence, today);

  if (selected > firstDue.max) {
    return {
      ok: false,
      error: `For the first ${cadenceDisplayLabel(
        cadence,
      ).toLowerCase()} dose, select a date on or before ${firstDue.display}.`,
    };
  }

  if (selected < firstDue.min) {
    return {
      ok: false,
      error: `For the first ${cadenceDisplayLabel(
        cadence,
      ).toLowerCase()} dose, the earliest you can log is ${firstDue.display}.`,
    };
  }

  return { ok: true };
};

const getCadenceMinDays = (cadence: DewormingCadenceKind): number => {
  switch (cadence) {
    case 'every_14_days':
      return 12;
    case 'monthly':
      return 0;
    case 'every_2_months':
      return 30;
    case 'every_3_months':
      return 60;
  }
};

/**
 * Windowed late tiers (relative to the dose's expected date — scheduled due, or
 * `last completion + cadence interval` when no scheduled row is supplied):
 *  - within ±2 days        → ideal
 *  - +3 .. +5 days late    → acceptable
 *  - +6 .. +7 days late    → warn (accept with vet-check nudge)
 *  - +8 days or more late  → reject (gap too wide for protective coverage)
 *
 * Lower bound is the safety constraint `last completion + min cadence days`.
 */
const DEWORM_IDEAL_TOLERANCE_DAYS = 2;
const DEWORM_ACCEPTABLE_LATE_DAYS = 5;
const DEWORM_WARN_LATE_DAYS = 7;

const addCadenceInterval = (
  date: string,
  cadence: DewormingCadenceKind,
): string => {
  switch (cadence) {
    case 'every_14_days':
      return addDays(date, 14);
    case 'monthly':
      return addMonths(date, 1);
    case 'every_2_months':
      return addMonths(date, 2);
    case 'every_3_months':
      return addMonths(date, 3);
  }
};

const validateRegularDose = (
  selected: string,
  baseline: string,
  cadence: DewormingCadenceKind,
  scheduledDueDate?: string,
):
  | { ok: true; tier: 'ideal' | 'acceptable' | 'warn'; warning?: string }
  | { ok: false; error: string } => {
  const minDays = getCadenceMinDays(cadence);
  const minDate = addDays(baseline, minDays);

  if (selected < minDate) {
    return {
      ok: false,
      error: `For ${cadenceDisplayLabel(
        cadence,
      )}, choose a date on or after ${formatDisplayDate(
        minDate,
      )} (minimum spacing after the last logged dose).`,
    };
  }

  const anchor = scheduledDueDate
    ? toIsoDateOnly(scheduledDueDate)
    : addCadenceInterval(baseline, cadence);

  const daysFromAnchor = calendarDaysBetweenIsoDates(anchor, selected);

  if (daysFromAnchor > DEWORM_WARN_LATE_DAYS) {
    return {
      ok: false,
      error: `This is more than a week past the planned date (${formatDisplayDate(
        anchor,
      )}). The protective gap is too wide — please consult your vet before logging.`,
    };
  }

  if (daysFromAnchor > DEWORM_ACCEPTABLE_LATE_DAYS) {
    return {
      ok: true,
      tier: 'warn',
      warning: `This dose is ${daysFromAnchor} days after the planned date (${formatDisplayDate(
        anchor,
      )}). It's still acceptable, but consider checking in with your vet so the schedule can be reset cleanly.`,
    };
  }

  if (Math.abs(daysFromAnchor) <= DEWORM_IDEAL_TOLERANCE_DAYS) {
    return { ok: true, tier: 'ideal' };
  }

  return { ok: true, tier: 'acceptable' };
};

/**
 * Validates a deworming **log** date.
 *
 * @param scheduledDueDate Optional **current row’s due date**. When set, upper bounds widen so
 * overdue doses (due vs last completion drift) still validate in real life.
 */
export const validateLogDateForCadence = (
  dob: string,
  today: string,
  selectedDate: string,
  cadence: DewormingCadenceKind,
  lastCompletionDate?: string,
  scheduledDueDate?: string,
):
  | { ok: true; tier?: 'ideal' | 'acceptable' | 'warn'; warning?: string }
  | { ok: false; error: string } => {
  const s = toIsoDateOnly(selectedDate);
  const t = toIsoDateOnly(today);
  const d0 = toIsoDateOnly(dob);

  const step1 = validateNotBeforeDOB(s, d0);
  if (!step1.ok) return step1;

  const step2 = validateNotFuture(s, t);
  if (!step2.ok) return step2;

  if (!lastCompletionDate) {
    const first = validateFirstDose(s, d0, t, cadence);
    if (!first.ok) return first;
    return { ok: true };
  }

  const baseline = toIsoDateOnly(lastCompletionDate);
  const reg = validateRegularDose(s, baseline, cadence, scheduledDueDate);
  if (!reg.ok) return reg;

  const rollMin = getMinimumLogDate(d0, t, cadence);
  if (s < rollMin) {
    return {
      ok: false,
      error: `For ${cadenceDisplayLabel(
        cadence,
      )}, pick a date on or after ${formatDisplayDate(
        rollMin,
      )} (too far in the past for this interval).`,
    };
  }

  return reg;
};

const attachCadence = (
  item: ScheduleItem,
  dob: string,
  lifestyle: LifestyleType,
  petType: DewormPetType,
): ScheduleItem => ({
  ...item,
  cadence: getCadenceForDueDate(dob, item.dueDate, lifestyle, petType),
});

const buildIdealMilestoneDates = (
  dob: string,
  horizonEnd: string,
  petType: DewormPetType,
  lifestyle: LifestyleType,
): string[] => {
  const rule = getDewormingRule(petType);
  const dates: string[] = [];
  for (const w of rule.startWeeks) {
    dates.push(addWeeks(dob, w));
  }
  for (const m of growthMonthMilestones(rule)) {
    dates.push(addMonths(dob, m));
  }
  let adultCursor = adultStartDate(dob, rule);
  const adultStep = adultIntervalMonthsFromLifestyle(petType, lifestyle);
  const cap = horizonEnd > adultCursor ? horizonEnd : addMonths(dob, 36);
  while (adultCursor <= cap) {
    dates.push(adultCursor);
    adultCursor = addMonths(adultCursor, adultStep);
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
  return [...new Set(raw.map(toIsoDateOnly))].sort((a, b) =>
    a.localeCompare(b),
  );
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
  petType: DewormPetType,
  completions: Set<string>,
  startIndex: number,
): ScheduleItem[] => {
  const out: ScheduleItem[] = [];
  let idx = startIndex;
  const rule = getDewormingRule(petType);
  const adultStart = adultStartDate(dob, rule);
  const earlyEndWeeks = earlyPhaseEndWeeks(rule);
  const phaseL = phaseAtDate(dob, L, rule);

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
      if (getAgeInWeeks(dob, next) > earlyEndWeeks) {
        break;
      }
      push(next);
      lastScheduled = next;
      cursor = next;
    }
    let gCursor = lastScheduled;
    let nextG = addMonths(gCursor, 1);
    while (nextG < adultStart) {
      push(nextG);
      lastScheduled = nextG;
      gCursor = nextG;
      nextG = addMonths(gCursor, 1);
    }
  } else if (phaseL === 'growth') {
    let cursor = L;
    let nextG = addMonths(cursor, 1);
    let guard = 0;
    while (nextG < adultStart && guard < 24) {
      push(nextG);
      lastScheduled = nextG;
      cursor = nextG;
      nextG = addMonths(cursor, 1);
      guard += 1;
    }
  }

  const step = adultIntervalMonthsFromLifestyle(petType, lifestyle);
  let adultAnchor: string;
  if (phaseL === 'adult' || L >= adultStart) {
    adultAnchor = L;
  } else {
    adultAnchor = lastScheduled > L ? lastScheduled : adultStart;
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
  petType: DewormPetType,
  completions: Set<string>,
): ScheduleItem[] => {
  const horizonEnd = addMonths(today, 36);
  const ideal = buildIdealMilestoneDates(dob, horizonEnd, petType, lifestyle);
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
    petType,
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
    const petType = input.petType;
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
      petType,
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
        nextStep = attachCadence({ ...primary }, dob, lifestyle, petType);
        if (hasSymptoms) {
          urgency = 'critical';
          riskLevel = 'high';
        } else if (primary.status === 'missed') {
          const daysOverdue = calendarDaysBetweenIsoDates(
            primary.dueDate,
            today,
          );
          urgency = daysOverdue > 15 ? 'critical' : 'high';
          riskLevel = daysOverdue > 15 ? 'high' : 'medium';
        } else {
          const daysUntil = calendarDaysBetweenIsoDates(
            today,
            primary.dueDate,
          );
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
      .map(p => attachCadence(p, dob, lifestyle, petType));

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
    petType: 'dog' | 'cat';
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
      petType: input.petType,
      dateOfBirth: input.dateOfBirth,
      lifestyle: input.lifestyle,
      todayDate: input.todayDate,
      completionDates: [...merged],
    });
  }
}

export const dewormingEngine = new DewormingEngine();
