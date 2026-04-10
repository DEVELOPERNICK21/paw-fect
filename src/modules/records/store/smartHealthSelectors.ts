import type {
  SmartHealthRecord,
  SmartHealthRecordType,
} from '../domain/models/SmartHealthRecord';
import { PetCareLifecycleEngine } from '../domain/utils/PetCareLifecycleEngine';

const lifecycleEngine = new PetCareLifecycleEngine();

const isActionable = (record: SmartHealthRecord): boolean =>
  record.status === 'overdue' ||
  record.status === 'missed' ||
  record.status === 'upcoming';

const isRabiesFamily = (record: SmartHealthRecord): boolean =>
  record.family?.toLowerCase() === 'rabies';

// Priority-based sorting: overdue/missed > rabies (critical) > upcoming > locked/future
const sortByPriority = (records: SmartHealthRecord[]): SmartHealthRecord[] => {
  const priorityScore = (r: SmartHealthRecord): number => {
    if (r.status === 'overdue' || r.status === 'missed') return 0;
    if (isRabiesFamily(r) && r.status === 'upcoming') return 1;
    if (r.status === 'locked') return 100;
    if (r.status === 'upcoming') return 2;
    return 10;
  };

  return [...records].sort((a, b) => {
    const scoreA = priorityScore(a);
    const scoreB = priorityScore(b);
    if (scoreA !== scoreB) return scoreA - scoreB;
    // Same priority = sort by date
    return a.dueDate.localeCompare(b.dueDate);
  });
};

export interface SmartHealthSelectors {
  getByType: (
    records: SmartHealthRecord[],
    type: SmartHealthRecordType,
  ) => SmartHealthRecord[];
  getNextActionTask: (records: SmartHealthRecord[]) => SmartHealthRecord | null;
  getUpcomingShortList: (
    records: SmartHealthRecord[],
    limit?: number,
  ) => SmartHealthRecord[];
  getNextVaccinationTask: (
    records: SmartHealthRecord[],
  ) => SmartHealthRecord | null;
  getUpcomingVaccinations: (
    records: SmartHealthRecord[],
    limit?: number,
  ) => SmartHealthRecord[];
  getCompletedTasks: (records: SmartHealthRecord[]) => SmartHealthRecord[];
  getFullSchedule: (records: SmartHealthRecord[]) => SmartHealthRecord[];
  getActionRequiredItems: (
    records: SmartHealthRecord[],
    limit?: number,
  ) => SmartHealthRecord[];
  getUpcomingItems: (
    records: SmartHealthRecord[],
    options?: { limit?: number; dedupeByFamily?: boolean },
  ) => SmartHealthRecord[];
  getHistoryItems: (records: SmartHealthRecord[]) => SmartHealthRecord[];
  getOverdueCount: (records: SmartHealthRecord[]) => number;
  partitionRecords: (records: SmartHealthRecord[]) => {
    overdue: SmartHealthRecord[];
    dueSoon: SmartHealthRecord[];
    futureSchedule: SmartHealthRecord[];
    history: SmartHealthRecord[];
  };
}

export const smartHealthSelectors: SmartHealthSelectors = {
  getByType: (records, type) =>
    sortByPriority(records.filter(record => record.type === type)),

  getNextActionTask: records => {
    const prioritized = sortByPriority(
      records.filter(record => isActionable(record)),
    );
    if (prioritized.length === 0) return null;
    return prioritized[0];
  },

  getUpcomingShortList: (records, limit = 3) => {
    const nextAction = smartHealthSelectors.getNextActionTask(records);
    return sortByPriority(
      records.filter(record => isActionable(record)),
    )
      .filter(r => r.id !== nextAction?.id)
      .slice(0, limit);
  },

  getNextVaccinationTask: records => {
    const vaccinations = records.filter(
      record => record.type === 'vaccination' && isActionable(record),
    );
    if (vaccinations.length === 0) return null;
    return sortByPriority(vaccinations)[0] ?? null;
  },

  getUpcomingVaccinations: (records, limit = 5) => {
    const vaccinations = records.filter(
      record => record.type === 'vaccination' && record.status === 'upcoming',
    );
    const nextVaccination = smartHealthSelectors.getNextVaccinationTask(records);
    return sortByPriority(vaccinations)
      .filter(record => record.id !== nextVaccination?.id)
      .slice(0, limit);
  },

  getCompletedTasks: records => records.filter(r => r.status === 'completed'),

  getFullSchedule: records => sortByPriority(records),

  getActionRequiredItems: (records, limit = 2) =>
    sortByPriority(lifecycleEngine.getActionRequiredList(records, limit)),

  getUpcomingItems: (records, options) =>
    sortByPriority(
      lifecycleEngine.getUpcoming(
        records,
        options?.limit ?? 5,
        options?.dedupeByFamily ?? true,
      ),
    ),

  getHistoryItems: records => lifecycleEngine.getHistory(records),

  getOverdueCount: records =>
    records.filter(r => r.status === 'overdue').length,

  partitionRecords: records => {
    // Sort by priority before partitioning
    const sorted = sortByPriority(records);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    return {
      overdue: sorted.filter(r => r.status === 'overdue'),
      dueSoon: sorted.filter(
        r => r.status === 'upcoming' && r.dueDate <= nextWeek,
      ),
      futureSchedule: sorted.filter(
        r =>
          (r.status === 'upcoming' || r.status === 'locked') &&
          r.dueDate > nextWeek,
      ),
      history: sorted.filter(
        r =>
          r.status === 'completed' ||
          r.status === 'missed' ||
          r.status === 'skipped',
      ),
    };
  },
};
