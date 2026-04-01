import { createLocalId } from '../../../../shared/utils/id';
import type {
  CarePlanContext,
  LifestyleType,
  SpeciesCarePlanTemplate,
  VaccineRule,
} from '../models/CarePlanTemplate';
import { CARE_PLAN_TEMPLATES } from '../models/CarePlanTemplates';
import type { SmartHealthRecord } from '../models/SmartHealthRecord';

const DAY_MS = 24 * 60 * 60 * 1000;

const toIsoDateOnly = (value: string): string => value.slice(0, 10);

const addDays = (date: string, days: number): string => {
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDateOnly(d.toISOString());
};

const addWeeks = (date: string, weeks: number): string => addDays(date, weeks * 7);

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

const resolveStatus = (
  dueDate: string,
  nowDate: string,
): SmartHealthRecord['status'] => {
  if (nowDate > dueDate) return 'overdue';
  if (daysBetween(nowDate, dueDate) > 30) return 'locked';
  return 'upcoming';
};

const recordId = (petId: string, type: string, key: string, dueDate: string): string =>
  `${petId}-${type}-${key}-${dueDate}`;

const shouldIncludeByLifestyle = (
  triggers: LifestyleType[] | undefined,
  lifestyle: LifestyleType,
): boolean => {
  if (!triggers || triggers.length === 0) return true;
  return triggers.includes(lifestyle);
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
  riskLevel?: SmartHealthRecord['riskLevel'];
  lifestyleTriggers?: string[];
  doseNumber?: number;
  totalDoses?: number;
  isOptional?: boolean;
}): SmartHealthRecord => {
  const nowIso = new Date().toISOString();
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
    status: resolveStatus(params.dueDate, params.nowDate),
    recurrenceType: params.recurrenceType,
    riskLevel: params.riskLevel,
    lifestyleTriggers: params.lifestyleTriggers,
    doseNumber: params.doseNumber,
    totalDoses: params.totalDoses,
    isOptional: params.isOptional,
    recovery: { isRecovered: false, recoveredFrom: null },
    createdAt: nowIso,
    updatedAt: nowIso,
  };
};

const dogAdultCoreCatchup = (): Array<{ key: string; label: string; offsetWeeks: number }> => [
  { key: 'DHPP_ADULT_START', label: 'DHPP (Start Vaccination)', offsetWeeks: 0 },
  { key: 'DHPP_ADULT_FOLLOW_UP', label: 'DHPP (Follow-up Dose)', offsetWeeks: 3 },
];

const catAdultCoreCatchup = (): Array<{ key: string; label: string; offsetWeeks: number }> => [
  { key: 'FVRCP_ADULT_START', label: 'FVRCP (Start Vaccination)', offsetWeeks: 0 },
  { key: 'FVRCP_ADULT_FOLLOW_UP', label: 'FVRCP (Follow-up Dose)', offsetWeeks: 3 },
];

export class PetCareLifecycleEngine {
  private familyKey(record: SmartHealthRecord): string {
    if (record.family?.trim()) return record.family.trim().toLowerCase();
    return record.name.split('(')[0]?.trim().toLowerCase() || record.name.toLowerCase();
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
  }): SmartHealthRecord[] {
    const { userId, petId, context } = input;
    const template = this.getTemplate(context.petType);
    const records: SmartHealthRecord[] = [];

    const dob = context.dateOfBirth;
    const ageWeeks = Math.max(0, Math.floor(daysBetween(dob, context.nowDate) / 7));
    const isPuppyOrKitten = ageWeeks < 20;
    const hasVaccinationHistory = Boolean(input.lastVaccinationDate);
    const hasDewormingHistory = Boolean(input.lastDewormingDate);
    const isAdultUnknownHistory = !isPuppyOrKitten && !hasVaccinationHistory;

    const pushVaccineRule = (rule: VaccineRule): void => {
      if (!shouldIncludeByLifestyle(rule.lifestyleTriggers, context.lifestyleType)) {
        return;
      }
      records.push(
        toSmartRecord({
          userId,
          petId,
          type: 'vaccination',
          key: rule.key,
          family: rule.family,
          name: rule.label,
          dueDate: addWeeks(dob, rule.ageWeeksMin),
          nowDate: context.nowDate,
          category: rule.category,
          recurrenceType: 'none',
          lifestyleTriggers: rule.lifestyleTriggers,
          riskLevel: rule.riskLevel,
          doseNumber: rule.doseNumber,
          totalDoses: rule.totalDoses,
          isOptional: rule.isOptional,
        }),
      );
    };

    if (isAdultUnknownHistory) {
      const catchupSeries =
        context.petType === 'dog'
          ? dogAdultCoreCatchup()
          : catAdultCoreCatchup();
      for (const dose of catchupSeries) {
        records.push(
          toSmartRecord({
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
          }),
        );
      }
    } else {
      template.coreSeries.forEach(pushVaccineRule);
    }

    if (isPuppyOrKitten) {
      const nonOptionalCore = template.coreSeries
        .filter(rule => !rule.isOptional)
        .slice()
        .sort((a, b) => a.ageWeeksMin - b.ageWeeksMin);
      const lastCore = nonOptionalCore[nonOptionalCore.length - 1];
      if (lastCore) {
        const lastCoreDue = addWeeks(dob, lastCore.ageWeeksMin);
        records.push(
          toSmartRecord({
            userId,
            petId,
            type: 'vaccination',
            key: `${lastCore.family.toUpperCase()}_BOOSTER_6MO`,
            family: lastCore.family,
            name: `${lastCore.family} Booster (6-month)`,
            dueDate: addMonths(lastCoreDue, 6),
            nowDate: context.nowDate,
            category: 'core',
            recurrenceType: 'yearly',
          }),
        );
      }
    }

    const rabiesFirstDue = isAdultUnknownHistory
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

    const rabiesRepeatMonths =
      template.rabies.regionOverrides?.[context.region] ??
      template.rabies.repeatIntervalMonthsAfterBooster;
    const rabiesBoosterAnchor = input.lastVaccinationDate ?? rabiesFirstDue;
    records.push(
      toSmartRecord({
        userId,
        petId,
        type: 'vaccination',
        key: `${template.rabies.key}_BOOSTER`,
        family: template.rabies.family,
        name: 'Rabies Booster',
        dueDate: addMonths(rabiesBoosterAnchor, rabiesRepeatMonths),
        nowDate: context.nowDate,
        category: 'core',
        recurrenceType: 'yearly',
      }),
    );

    for (const rule of template.nonCoreSeries) {
      if (
        shouldIncludeByLifestyle(rule.lifestyleTriggers, context.lifestyleType) ||
        context.lifestyleRiskLevel === 'high'
      ) {
        pushVaccineRule(rule);
      }
    }

    const dewormDates = isPuppyOrKitten
      ? template.deworming.startWeeks.map(week => addWeeks(dob, week))
      : [];
    const intervalByLifestyle =
      context.lifestyleType === 'outdoor'
        ? template.deworming.outdoorIntervalDays
        : context.lifestyleType === 'mixed'
        ? template.deworming.mixedIntervalDays
        : template.deworming.indoorIntervalDays;
    const riskInterval =
      context.lifestyleRiskLevel === 'high'
        ? 15
        : context.lifestyleRiskLevel === 'medium'
        ? 21
        : 30;
    const juvenileIntervalDays = Math.min(intervalByLifestyle, riskInterval);
    const sixMonthDate = addMonths(dob, template.deworming.untilMonths);
    const oneYearDate = addMonths(dob, 12);
    const dewormSet = new Set(dewormDates);
    let rolling = dewormDates[dewormDates.length - 1] ?? context.nowDate;
    if (isPuppyOrKitten) {
      while (rolling < sixMonthDate) {
        rolling = addDays(rolling, juvenileIntervalDays);
        if (rolling <= sixMonthDate) dewormSet.add(rolling);
      }
      while (rolling < oneYearDate) {
        rolling = addMonths(rolling, template.deworming.adultIntervalMonths);
        if (rolling <= oneYearDate) dewormSet.add(rolling);
      }
    } else if (!hasDewormingHistory) {
      dewormSet.add(context.nowDate);
      dewormSet.add(addMonths(context.nowDate, template.deworming.adultIntervalMonths));
    }
    for (const dueDate of Array.from(dewormSet).sort()) {
      records.push(
        toSmartRecord({
          userId,
          petId,
          type: 'deworming',
          key: `DEWORM_${dueDate}`,
          family: 'Deworming',
          name: 'Deworming',
          dueDate,
          nowDate: context.nowDate,
          category: 'core',
          recurrenceType: 'none',
        }),
      );
    }

    const dewormIntervalDays = juvenileIntervalDays;
    const dewormAnchor = input.lastDewormingDate ?? context.nowDate;
    const recurringDue = addDays(dewormAnchor, dewormIntervalDays);
    records.push(
      toSmartRecord({
        userId,
        petId,
        type: 'deworming',
        key: 'DEWORMING_RECURRING',
        family: 'Deworming',
        name: 'Deworming',
        dueDate: recurringDue,
        nowDate: context.nowDate,
        category: 'core',
        recurrenceType: 'quarterly',
      }),
    );

    return records.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  getActionRequired(records: SmartHealthRecord[]): SmartHealthRecord | null {
    return this.getActionRequiredList(records, 1)[0] ?? null;
  }

  getActionRequiredList(records: SmartHealthRecord[], limit = 2): SmartHealthRecord[] {
    const actionable = records
      .filter(r => r.status === 'overdue' || r.status === 'upcoming')
      .slice()
      .sort((a, b) => {
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (b.status === 'overdue' && a.status !== 'overdue') return 1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    return actionable.slice(0, limit);
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
      .filter(r => r.status === 'completed' || r.status === 'missed')
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
      | { type: 'late_completion'; recordId: string; completedDate: string }
      | { type: 'missed'; recordId: string }
      | { type: 'backdated_entry'; recordId: string; completedDate: string }
      | { type: 'manual_adjustment'; recordId: string; dueDate: string };
    contextNowDate: string;
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

    if (
      params.event.type === 'late_completion' ||
      params.event.type === 'backdated_entry'
    ) {
      target.completedDate = params.event.completedDate;
      target.status = 'completed';
      target.recovery = {
        isRecovered: params.event.type === 'late_completion',
        recoveredFrom: target.id,
        recoveryReason:
          params.event.type === 'late_completion' ? 'late' : 'manual_adjustment',
      };
      target.updatedAt = nowIso;

      if (target.type === 'deworming' && target.recurrenceType !== 'none') {
        const nextDate = addDays(params.event.completedDate, 30);
        const existingNext = cloned.find(
          r =>
            r.petId === target.petId &&
            r.type === 'deworming' &&
            r.recurrenceType !== 'none' &&
            r.status !== 'completed',
        );
        if (existingNext) {
          existingNext.dueDate = nextDate;
          existingNext.recommendedDate = nextDate;
          existingNext.status = resolveStatus(nextDate, params.contextNowDate);
          existingNext.recovery = {
            isRecovered: true,
            recoveredFrom: target.id,
            recoveryReason: 'late',
          };
          existingNext.updatedAt = nowIso;
        } else {
          cloned.push({
            ...toSmartRecord({
              userId: target.userId,
              petId: target.petId,
              type: 'deworming',
              key: `DEWORM_RECOVERED_${nextDate}`,
              family: 'Deworming',
              name: target.name,
              dueDate: nextDate,
              nowDate: params.contextNowDate,
              category: 'core',
              recurrenceType: 'quarterly',
            }),
            id: createLocalId('smart-health'),
            recovery: {
              isRecovered: true,
              recoveredFrom: target.id,
              recoveryReason: 'late',
            },
          });
        }
      }
      return cloned.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    }

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
