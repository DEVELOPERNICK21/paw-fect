import type { SmartHealthRecord } from '../../modules/records/domain/models/SmartHealthRecord';

/** Max actionable health rows that receive reminders per pet (each row → up to 3 triggers). */
export const MAX_HEALTH_NOTIFICATIONS_PER_PET = 6;

/** Global ceiling across all pets (fair round-robin fills this). */
export const MAX_HEALTH_NOTIFICATIONS_TOTAL = 48;

export interface SmartHealthNotificationCoverage {
  totalSchedulable: number;
  scheduledCount: number;
  capped: boolean;
  byPet: Record<
    string,
    {
      schedulable: number;
      scheduled: number;
    }
  >;
}

const ACTIONABLE_STATUSES = new Set<SmartHealthRecord['status']>([
  'upcoming',
  'overdue',
  'missed',
]);

export function getSchedulableHealthRecords(
  records: SmartHealthRecord[],
): SmartHealthRecord[] {
  return records.filter(record => ACTIONABLE_STATUSES.has(record.status));
}

function statusPriority(status: SmartHealthRecord['status']): number {
  if (status === 'overdue' || status === 'missed') {
    return 0;
  }
  return 1;
}

function compareSchedulableRecords(
  a: SmartHealthRecord,
  b: SmartHealthRecord,
): number {
  const priorityDelta = statusPriority(a.status) - statusPriority(b.status);
  if (priorityDelta !== 0) {
    return priorityDelta;
  }
  return a.dueDate.localeCompare(b.dueDate);
}

/**
 * Fair round-robin: each pet gets equal slots up to maxPerPet, stopping at maxTotal.
 * Overdue/missed rows are prioritized within each pet before upcoming rows.
 */
export function selectHealthRecordsForNotifications(
  records: SmartHealthRecord[],
  options?: {
    maxPerPet?: number;
    maxTotal?: number;
  },
): SmartHealthRecord[] {
  const maxPerPet = options?.maxPerPet ?? MAX_HEALTH_NOTIFICATIONS_PER_PET;
  const maxTotal = options?.maxTotal ?? MAX_HEALTH_NOTIFICATIONS_TOTAL;
  const schedulable = getSchedulableHealthRecords(records);

  const byPet = new Map<string, SmartHealthRecord[]>();
  for (const record of schedulable) {
    const list = byPet.get(record.petId) ?? [];
    list.push(record);
    byPet.set(record.petId, list);
  }

  for (const [petId, list] of byPet) {
    list.sort(compareSchedulableRecords);
    byPet.set(petId, list);
  }

  const petIds = [...byPet.keys()].sort();
  const selected: SmartHealthRecord[] = [];
  const perPetCount = new Map<string, number>();

  while (selected.length < maxTotal) {
    let addedThisRound = false;
    for (const petId of petIds) {
      const count = perPetCount.get(petId) ?? 0;
      if (count >= maxPerPet) {
        continue;
      }
      const list = byPet.get(petId);
      const record = list?.[count];
      if (record == null) {
        continue;
      }
      selected.push(record);
      perPetCount.set(petId, count + 1);
      addedThisRound = true;
      if (selected.length >= maxTotal) {
        break;
      }
    }
    if (!addedThisRound) {
      break;
    }
  }

  return selected;
}

export function computeSmartHealthNotificationCoverage(
  records: SmartHealthRecord[],
  options?: {
    maxPerPet?: number;
    maxTotal?: number;
  },
): SmartHealthNotificationCoverage {
  const schedulable = getSchedulableHealthRecords(records);
  const selected = selectHealthRecordsForNotifications(records, options);

  const byPet: SmartHealthNotificationCoverage['byPet'] = {};
  for (const record of schedulable) {
    const entry = byPet[record.petId] ?? { schedulable: 0, scheduled: 0 };
    entry.schedulable += 1;
    byPet[record.petId] = entry;
  }
  for (const record of selected) {
    const entry = byPet[record.petId] ?? { schedulable: 0, scheduled: 0 };
    entry.scheduled += 1;
    byPet[record.petId] = entry;
  }

  return {
    totalSchedulable: schedulable.length,
    scheduledCount: selected.length,
    capped: selected.length < schedulable.length,
    byPet,
  };
}
