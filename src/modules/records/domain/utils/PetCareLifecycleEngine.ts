// PetCareLifecycleEngine.ts — fully corrected

import type {
  CarePlanContext,
  LifestyleType,
  PetRegion,
  SpeciesCarePlanTemplate,
  VaccineRule,
} from '../models/CarePlanTemplate';
import { CARE_PLAN_TEMPLATES } from '../models/CarePlanTemplates';
import type { SmartHealthRecord } from '../models/SmartHealthRecord';
import { dewormingEngine } from './DewormingEngine';

const DAY_MS = 24 * 60 * 60 * 1000;

const toIsoDateOnly = (value: string): string => value.slice(0, 10);

const safeToIsoDate = (d: Date, fallback: string): string => {
  if (Number.isNaN(d.getTime())) {
    return toIsoDateOnly(fallback);
  }
  return toIsoDateOnly(d.toISOString());
};

const addDays = (date: string, days: number): string => {
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  d.setUTCDate(d.getUTCDate() + days);
  return safeToIsoDate(d, date);
};

const addWeeks = (date: string, weeks: number): string =>
  addDays(date, weeks * 7);

const addMonths = (date: string, months: number): string => {
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  d.setUTCMonth(d.getUTCMonth() + months);
  return safeToIsoDate(d, date);
};

const daysBetween = (from: string, to: string): number => {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.floor((b - a) / DAY_MS);
};

const resolveStatus = (
  dueDate: string,
  nowDate: string,
): SmartHealthRecord['status'] => {
  if (nowDate > dueDate) return 'overdue';
  if (daysBetween(nowDate, dueDate) > 30) return 'locked';
  return 'upcoming';
};

export const nextDateFromCadence = (
  anchorDate: string,
  cadence: SmartHealthRecord['cadence'],
): string => {
  switch (cadence) {
    case 'every_14_days':
      return addDays(anchorDate, 14);
    case 'monthly':
      return addMonths(anchorDate, 1);
    case 'every_2_months':
      return addMonths(anchorDate, 2);
    case 'every_3_months':
    default:
      return addMonths(anchorDate, 3);
  }
};

// FIX Bug 6: dedup key must NOT include dueDate
export const recordDedupeKey = (record: SmartHealthRecord): string =>
  `${record.type}:${record.key ?? ''}`;

const recordId = (
  petId: string,
  type: string,
  key: string,
  dueDate: string,
): string => `${petId}-${type}-${key}-${dueDate}`;

const shouldIncludeByLifestyle = (
  triggers: LifestyleType[] | undefined,
  lifestyle: LifestyleType,
): boolean => {
  if (!triggers || triggers.length === 0) return true;
  return triggers.includes(lifestyle);
};

const shouldIncludeByRegion = (
  excludedRegions: PetRegion[] | undefined,
  region: PetRegion,
): boolean => {
  if (!excludedRegions || excludedRegions.length === 0) return true;
  return !excludedRegions.includes(region);
};

const toSmartRecord = (params: {
  userId: string;
  petId: string;
  type: SmartHealthRecord['type'];
  key: string;
  family: string;
  name: string;
  dueDate: string;
  nowDate: string;
  category: 'core' | 'non-core';
  recurrenceType: SmartHealthRecord['recurrenceType'];
  cadence?: SmartHealthRecord['cadence'];
  recurrenceIntervalMonths?: number;
  riskLevel?: SmartHealthRecord['riskLevel'];
  lifestyleTriggers?: string[];
  doseNumber?: number;
  totalDoses?: number;
  isOptional?: boolean;
  stage?: SmartHealthRecord['stage'];
  dependsOn?: string | null;
  contextLabel?: string;
}): SmartHealthRecord => {
  const nowIso = new Date().toISOString();
  const status = resolveStatus(params.dueDate, params.nowDate);
  const isLocked = params.dependsOn !== null && params.dependsOn !== undefined;

  return {
    id: recordId(params.petId, params.type, params.key, params.dueDate),
    userId: params.userId,
    petId: params.petId,
    type: params.type,
    key: params.key,
    family: params.family,
    category: params.category,
    name: params.name,
    dueDate: params.dueDate,
    recommendedDate: params.dueDate,
    completedDate: null,
    status: isLocked ? 'locked' : status,
    recurrenceType: params.recurrenceType,
    recurrenceIntervalMonths: params.recurrenceIntervalMonths,
    cadence: params.cadence,
    riskLevel: params.riskLevel,
    lifestyleTriggers: params.lifestyleTriggers,
    doseNumber: params.doseNumber,
    totalDoses: params.totalDoses,
    isOptional: params.isOptional,
    stage: params.stage,
    dependsOn: params.dependsOn,
    source: 'system',
    isLocked: isLocked,
    priority: params.category === 'core' ? 'high' : 'medium',
    contextLabel: params.contextLabel,
    recovery: { isRecovered: false, recoveredFrom: null },
    createdAt: nowIso,
    updatedAt: nowIso,
  };
};

// Catch-up series for adults with no vaccination history
const dogAdultCoreCatchup = (): Array<{
  key: string;
  label: string;
  offsetWeeks: number;
}> => [
  { key: 'DHPP_ADULT_START', label: 'DHPP (Start)', offsetWeeks: 0 },
  { key: 'DHPP_ADULT_FOLLOW_UP', label: 'DHPP (Follow-up)', offsetWeeks: 3 },
];

const catAdultCoreCatchup = (): Array<{
  key: string;
  label: string;
  offsetWeeks: number;
}> => [
  { key: 'FVRCP_ADULT_START', label: 'FVRCP (Start)', offsetWeeks: 0 },
  { key: 'FVRCP_ADULT_FOLLOW_UP', label: 'FVRCP (Follow-up)', offsetWeeks: 3 },
];

const adultCoreBooster = (
  petType: 'dog' | 'cat',
): { key: string; family: string; name: string } =>
  petType === 'dog'
    ? {
        key: 'DHPP_ADULT_BOOSTER',
        family: 'DHPP',
        name: 'DHPP Booster',
      }
    : {
        key: 'FVRCP_ADULT_BOOSTER',
        family: 'FVRCP',
        name: 'FVRCP Booster',
      };

export class PetCareLifecycleEngine {
  private familyKey(record: SmartHealthRecord): string {
    if (record.family?.trim()) return record.family.trim().toLowerCase();
    return (
      record.name.split('(')[0]?.trim().toLowerCase() ||
      record.name.toLowerCase()
    );
  }

  getTemplate(petType: 'dog' | 'cat'): SpeciesCarePlanTemplate {
    return CARE_PLAN_TEMPLATES[petType];
  }

  generateInitialPlan(input: {
    userId: string;
    petId: string;
    context: CarePlanContext;
    lastVaccinationDate?: string;
    lastDewormingDate?: string;
    // FIX Bug 3: accept Rabies-specific last date separately
    lastRabiesDate?: string;
  }): SmartHealthRecord[] {
    const { userId, petId, context } = input;
    const template = this.getTemplate(context.petType);
    const records: SmartHealthRecord[] = [];

    const dob = context.dateOfBirth;
    const ageWeeks = Math.max(
      0,
      Math.floor(daysBetween(dob, context.nowDate) / 7),
    );

    // FIX Bug 1: puppy = under 52 weeks (1 year), not 20 weeks
    const stage: SmartHealthRecord['stage'] = ageWeeks < 52 ? 'puppy' : 'adult';

    const hasVaccinationHistory = Boolean(input.lastVaccinationDate);
    const isAdultUnknownHistory = stage === 'adult' && !hasVaccinationHistory;
    const isAdultKnownHistory = stage === 'adult' && hasVaccinationHistory;

    // FIX Bug 4: build dose sequence PER FAMILY, resetting prevId for each
    const buildDoseSequenceForFamily = (
      rules: VaccineRule[],
      // FIX Bug 2: for adults, non-core dates anchor to nowDate, not DOB
      dateAnchor: 'dob' | 'now',
    ): SmartHealthRecord[] => {
      // Group rules by family so dependencies are scoped within families
      const byFamily = new Map<string, VaccineRule[]>();
      for (const rule of rules) {
        if (
          !shouldIncludeByLifestyle(
            rule.lifestyleTriggers,
            context.lifestyleType,
          )
        ) {
          continue;
        }
        if (!shouldIncludeByRegion(rule.excludedRegions, context.region)) {
          continue;
        }
        const existing = byFamily.get(rule.family) ?? [];
        existing.push(rule);
        byFamily.set(rule.family, existing);
      }

      const results: SmartHealthRecord[] = [];

      for (const [, familyRules] of byFamily) {
        // FIX Bug 4: reset prevId at the start of EACH family
        let prevId: string | null = null;
        let prevDueDate: string | null = null;

        for (const rule of familyRules) {
          // FIX Bug 7: use intervalWeeksFromPreviousDose when a prior dose exists
          let dueDate: string;
          if (
            prevDueDate !== null &&
            rule.intervalWeeksFromPreviousDose !== undefined
          ) {
            dueDate = addWeeks(prevDueDate, rule.intervalWeeksFromPreviousDose);
          } else {
            const anchor = dateAnchor === 'now' ? context.nowDate : dob;
            dueDate = addWeeks(anchor, rule.ageWeeksMin);
          }

          const record = toSmartRecord({
            userId,
            petId,
            type: 'vaccination',
            key: rule.key,
            family: rule.family,
            name: rule.label,
            dueDate,
            nowDate: context.nowDate,
            category: rule.category,
            recurrenceType: 'none',
            lifestyleTriggers: rule.lifestyleTriggers,
            riskLevel: rule.riskLevel,
            doseNumber: rule.doseNumber,
            totalDoses: rule.totalDoses,
            isOptional: rule.isOptional,
            stage,
            dependsOn: prevId,
          });

          results.push(record);
          prevId = record.id;
          prevDueDate = dueDate;
        }
      }

      return results;
    };

    if (isAdultUnknownHistory) {
      // Adult with no history — catch-up series anchored to today
      const catchupSeries =
        context.petType === 'dog'
          ? dogAdultCoreCatchup()
          : catAdultCoreCatchup();

      let prevId: string | null = null;
      for (const dose of catchupSeries) {
        const record = toSmartRecord({
          userId,
          petId,
          type: 'vaccination',
          key: dose.key,
          family: context.petType === 'dog' ? 'DHPP' : 'FVRCP',
          name: dose.label,
          dueDate: addWeeks(context.nowDate, dose.offsetWeeks),
          nowDate: context.nowDate,
          category: 'core',
          recurrenceType: 'none',
          stage: 'adult',
          dependsOn: prevId,
          contextLabel: 'Start vaccination (no prior records)',
        });
        records.push(record);
        prevId = record.id;
      }
    } else if (stage === 'adult' && hasVaccinationHistory) {
      // Adult with known history — schedule next annual core booster from last shot.
      const lastVaccinationDate = input.lastVaccinationDate ?? context.nowDate;
      const coreBooster = adultCoreBooster(context.petType);
      records.push(
        toSmartRecord({
          userId,
          petId,
          type: 'vaccination',
          key: coreBooster.key,
          family: coreBooster.family,
          name: coreBooster.name,
          dueDate: addMonths(lastVaccinationDate, 12),
          nowDate: context.nowDate,
          category: 'core',
          recurrenceType: 'yearly',
          recurrenceIntervalMonths: 12,
          stage: 'adult',
          contextLabel: 'Booster due (history available)',
        }),
      );
    } else {
      // Normal puppy/adolescent series — dates from DOB
      records.push(...buildDoseSequenceForFamily(template.coreSeries, 'dob'));
    }

    // FIX Bug 8: 6-month booster anchors to the last REQUIRED (non-optional) dose's due date
    if (stage === 'puppy') {
      const requiredCoreDoses = template.coreSeries
        .filter(rule => !rule.isOptional)
        .slice()
        .sort((a, b) => a.ageWeeksMin - b.ageWeeksMin);
      const lastRequiredDose = requiredCoreDoses[requiredCoreDoses.length - 1];

      if (lastRequiredDose) {
        // Find the actual scheduled record so we use its real dueDate (not just DOB + weeks)
        const lastRequiredRecord = records.find(
          r => r.key === lastRequiredDose.key,
        );
        const boosterAnchor =
          lastRequiredRecord?.dueDate ??
          addWeeks(dob, lastRequiredDose.ageWeeksMin);

        records.push(
          toSmartRecord({
            userId,
            petId,
            type: 'vaccination',
            key: `${lastRequiredDose.family.toUpperCase()}_BOOSTER_6MO`,
            family: lastRequiredDose.family,
            name: `${lastRequiredDose.family} Booster (6-month)`,
            dueDate: addMonths(boosterAnchor, 6),
            nowDate: context.nowDate,
            category: 'core',
            recurrenceType: 'yearly',
            recurrenceIntervalMonths: 12,
            stage,
          }),
        );
      }
    }

    const shouldScheduleRabiesFirstDose =
      !isAdultKnownHistory && !input.lastRabiesDate;

    let rabiesFirstDue: string | null = null;
    if (shouldScheduleRabiesFirstDose) {
      // Rabies first dose
      rabiesFirstDue = isAdultUnknownHistory
        ? context.nowDate
        : addWeeks(dob, template.rabies.firstDoseAgeWeeksMin);

      records.push(
        toSmartRecord({
          userId,
          petId,
          type: 'vaccination',
          key: template.rabies.key,
          family: template.rabies.family,
          name: template.rabies.label,
          dueDate: rabiesFirstDue,
          nowDate: context.nowDate,
          category: 'core',
          recurrenceType: 'none',
        }),
      );
    }

    // First booster after primary = boosterAfterMonths (typically 12).
    // Later repeats use regionOverrides (IN/OTHER 12, US/EU 36).
    // Never anchor rabies to an unrelated lastVaccinationDate.
    const rabiesRepeatMonths =
      template.rabies.regionOverrides?.[context.region] ??
      template.rabies.repeatIntervalMonthsAfterBooster;
    const hasCompletedRabiesHistory = Boolean(input.lastRabiesDate);
    const rabiesBoosterMonths = hasCompletedRabiesHistory
      ? rabiesRepeatMonths
      : template.rabies.boosterAfterMonths;
    const rabiesBoosterAnchor =
      input.lastRabiesDate ?? rabiesFirstDue ?? null;

    if (rabiesBoosterAnchor) {
      records.push(
        toSmartRecord({
          userId,
          petId,
          type: 'vaccination',
          key: `${template.rabies.key}_BOOSTER`,
          family: template.rabies.family,
          name: 'Rabies Booster',
          dueDate: addMonths(rabiesBoosterAnchor, rabiesBoosterMonths),
          nowDate: context.nowDate,
          category: 'core',
          recurrenceType: 'yearly',
          // After this booster is given, subsequent repeats use region interval.
          recurrenceIntervalMonths: rabiesRepeatMonths,
        }),
      );
    }

    // FIX Bug 2: non-core vaccines for adults anchor to nowDate
    const nonCoreAnchor: 'dob' | 'now' = stage === 'adult' ? 'now' : 'dob';
    records.push(
      ...buildDoseSequenceForFamily(template.nonCoreSeries, nonCoreAnchor),
    );

    const dewormingResult = dewormingEngine.execute({
      petType: context.petType,
      dateOfBirth: dob,
      lifestyle: context.lifestyleType,
      todayDate: context.nowDate,
      lastDewormingDate: input.lastDewormingDate,
      completionDates: input.lastDewormingDate ? [input.lastDewormingDate] : [],
      hasPreviousDeworming: Boolean(input.lastDewormingDate),
    });

    const dewormingItems: Array<{
      dueDate: string;
      status: 'completed' | 'pending' | 'missed';
      cadence?: SmartHealthRecord['cadence'];
      recurrenceType: SmartHealthRecord['recurrenceType'];
    }> = [];

    if (dewormingResult.nextStep) {
      dewormingItems.push({
        dueDate: dewormingResult.nextStep.dueDate,
        status: dewormingResult.nextStep.status,
        cadence: dewormingResult.nextStep.cadence,
        recurrenceType: 'quarterly',
      });
    }

    for (const item of dewormingResult.upcoming) {
      dewormingItems.push({
        dueDate: item.dueDate,
        status: item.status,
        cadence: item.cadence,
        recurrenceType: 'none',
      });
    }

    for (const item of dewormingResult.completed) {
      dewormingItems.push({
        dueDate: item.dueDate,
        status: item.status,
        cadence: item.cadence,
        recurrenceType: 'none',
      });
    }

    const seenDeworm = new Set<string>();
    for (const item of dewormingItems.sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate),
    )) {
      if (seenDeworm.has(item.dueDate)) continue;
      seenDeworm.add(item.dueDate);

      const base = toSmartRecord({
        userId,
        petId,
        type: 'deworming',
        key: `DEWORM_${item.dueDate}`,
        family: 'Deworming',
        name: 'Deworming',
        dueDate: item.dueDate,
        nowDate: context.nowDate,
        category: 'core',
        recurrenceType: item.recurrenceType,
        cadence: item.cadence,
        stage,
      });

      records.push({
        ...base,
        status:
          item.status === 'pending'
            ? 'upcoming'
            : item.status === 'missed'
            ? 'missed'
            : 'completed',
        completedDate: item.status === 'completed' ? item.dueDate : null,
      });
    }

    return records.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  // ── Query helpers (unchanged) ──────────────────────────────────────────

  getActionRequired(records: SmartHealthRecord[]): SmartHealthRecord | null {
    return this.getActionRequiredList(records, 1)[0] ?? null;
  }

  getActionRequiredList(
    records: SmartHealthRecord[],
    limit = 2,
  ): SmartHealthRecord[] {
    return records
      .filter(
        r =>
          r.status === 'overdue' ||
          r.status === 'upcoming' ||
          r.status === 'missed',
      )
      .slice()
      .sort((a, b) => {
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (b.status === 'overdue' && a.status !== 'overdue') return 1;
        return a.dueDate.localeCompare(b.dueDate);
      })
      .slice(0, limit);
  }

  getUpcoming(
    records: SmartHealthRecord[],
    limit = 5,
    dedupeByFamily = true,
  ): SmartHealthRecord[] {
    const sorted = records
      .filter(r => r.status === 'upcoming' || r.status === 'locked')
      .slice()
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    if (!dedupeByFamily) return sorted.slice(0, limit);

    const seen = new Set<string>();
    const deduped: SmartHealthRecord[] = [];
    for (const item of sorted) {
      const key = this.familyKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
      if (deduped.length >= limit) break;
    }
    return deduped;
  }

  getHistory(records: SmartHealthRecord[]): SmartHealthRecord[] {
    return records
      .filter(
        r =>
          r.status === 'completed' ||
          r.status === 'missed' ||
          r.status === 'skipped',
      )
      .slice()
      .sort((a, b) => {
        const ad = a.completedDate ?? a.dueDate;
        const bd = b.completedDate ?? b.dueDate;
        return bd.localeCompare(ad);
      });
  }

  recalculatePlanOnEvent(params: {
    records: SmartHealthRecord[];
    event:
      | { type: 'missed'; recordId: string }
      | {
          type: 'completion';
          recordId: string;
          completedDate: string;
        }
      | { type: 'manual_adjustment'; recordId: string; dueDate: string }
      | {
          type: 'skip_dose';
          recordId: string;
          reason: string;
          petDateOfBirth?: string;
        };
    contextNowDate: string;
    petDateOfBirth?: string;
  }): SmartHealthRecord[] {
    const cloned = params.records.map(r => ({ ...r }));
    const target = cloned.find(r => r.id === params.event.recordId);
    if (!target) return cloned;
    const nowIso = new Date().toISOString();

    if (params.event.type === 'missed') {
      target.status = 'missed';
      target.recovery = {
        isRecovered: false,
        recoveredFrom: target.id,
        recoveryReason: 'missed',
      };
      target.updatedAt = nowIso;
      return cloned;
    }

    if (params.event.type === 'skip_dose') {
      const cadence = target.cadence ?? 'every_3_months';
      target.status = 'skipped';
      target.completedDate = null;
      target.skipReason = params.event.reason.trim();
      target.recovery = {
        isRecovered: true,
        recoveredFrom: target.id,
        recoveryReason: 'manual_adjustment',
      };
      target.updatedAt = nowIso;

      if (target.type === 'deworming') {
        const dob =
          params.event.petDateOfBirth ?? params.petDateOfBirth ?? undefined;

        for (const r of cloned) {
          if (r.type !== 'deworming' || r.id === target.id) continue;
          if (r.petId !== target.petId) continue;
          if (r.status === 'completed' || r.status === 'skipped') continue;
          if (r.dueDate < target.dueDate) {
            r.status = 'skipped';
            r.skipReason = 'superseded_open_dose';
            r.completedDate = null;
            r.updatedAt = nowIso;
          }
        }

        const lastCompleted = cloned
          .filter(
            r =>
              r.type === 'deworming' &&
              r.petId === target.petId &&
              r.status === 'completed' &&
              r.completedDate,
          )
          .map(r => r.completedDate as string)
          .sort((a, b) => b.localeCompare(a))[0];

        let cursor: string;
        if (lastCompleted) {
          cursor = nextDateFromCadence(lastCompleted, cadence);
        } else if (dob) {
          cursor = nextDateFromCadence(dob, cadence);
        } else {
          cursor = nextDateFromCadence(target.dueDate, cadence);
        }

        while (cursor <= target.dueDate) {
          cursor = nextDateFromCadence(cursor, cadence);
        }
        while (cursor < params.contextNowDate) {
          cursor = nextDateFromCadence(cursor, cadence);
        }

        const futureDeworming = cloned
          .filter(
            r =>
              r.type === 'deworming' &&
              r.petId === target.petId &&
              r.id !== target.id &&
              r.status !== 'completed' &&
              r.status !== 'skipped' &&
              r.dueDate >= target.dueDate,
          )
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

        for (const item of futureDeworming) {
          item.dueDate = cursor;
          item.recommendedDate = cursor;
          item.key = `DEWORM_${cursor}`;
          item.status = resolveStatus(cursor, params.contextNowDate);
          item.updatedAt = nowIso;
          cursor = nextDateFromCadence(cursor, item.cadence ?? cadence);
        }
      }

      return cloned.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    }

    if (params.event.type === 'completion') {
      const completedDate = params.event.completedDate;
      const isLate = completedDate > target.dueDate;
      const isEarly = completedDate < target.dueDate;

      target.completedDate = completedDate;
      target.status = 'completed';
      target.updatedAt = nowIso;
      if (isLate) {
        target.recovery = {
          isRecovered: true,
          recoveredFrom: target.id,
          recoveryReason: 'late',
        };
      } else if (isEarly) {
        target.recovery = {
          isRecovered: true,
          recoveredFrom: target.id,
          recoveryReason: 'manual_adjustment',
        };
      } else {
        target.recovery = {
          isRecovered: false,
          recoveredFrom: null,
        };
      }

      if (target.type === 'deworming') {
        for (const r of cloned) {
          if (r.type !== 'deworming' || r.id === target.id) continue;
          if (r.petId !== target.petId) continue;
          if (r.status === 'completed' || r.status === 'skipped') continue;
          if (r.dueDate < completedDate) {
            r.status = 'skipped';
            r.skipReason = 'superseded_by_completion';
            r.completedDate = null;
            r.updatedAt = nowIso;
          }
        }

        const futureDeworming = cloned
          .filter(
            r =>
              r.type === 'deworming' &&
              r.petId === target.petId &&
              r.id !== target.id &&
              r.status !== 'completed' &&
              r.status !== 'skipped' &&
              r.dueDate >= target.dueDate,
          )
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

        let cursor = completedDate;
        for (const item of futureDeworming) {
          cursor = nextDateFromCadence(cursor, item.cadence ?? target.cadence);
          item.dueDate = cursor;
          item.recommendedDate = cursor;
          item.key = `DEWORM_${cursor}`;
          item.status = resolveStatus(cursor, params.contextNowDate);
          item.updatedAt = nowIso;
        }
      }

      const dependents = cloned.filter(r => r.dependsOn === target.id);
      for (const dep of dependents) {
        if (dep.status === 'locked') {
          const newDue = addWeeks(completedDate, 3);
          dep.dueDate = newDue;
          dep.recommendedDate = newDue;
          dep.status = resolveStatus(newDue, params.contextNowDate);
          dep.dependsOn = null;
          dep.isLocked = false;
          dep.updatedAt = nowIso;
        }
      }

      return cloned.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    }

    // manual_adjustment
    target.dueDate = params.event.dueDate;
    target.recommendedDate = params.event.dueDate;
    target.status = resolveStatus(params.event.dueDate, params.contextNowDate);
    target.recovery = {
      isRecovered: true,
      recoveredFrom: target.id,
      recoveryReason: 'manual_adjustment',
    };
    target.updatedAt = nowIso;
    return cloned.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }
}
