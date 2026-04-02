import type {
  SmartHealthRecord,
  SmartHealthRecordType,
} from '../domain/models/SmartHealthRecord';
import { PetCareLifecycleEngine } from '../domain/utils/PetCareLifecycleEngine';

const lifecycleEngine = new PetCareLifecycleEngine();

// Priority-based sorting: overdue > rabies (critical) > other vaccines > future
const sortByPriority = (records: SmartHealthRecord[]): SmartHealthRecord[] => {
  const priorityScore = (r: SmartHealthRecord): number => {
    // Overdue = highest priority (0)
    if (r.status === 'overdue') return 0;
    // Rabies = critical (1)
    if (r.family?.toLowerCase() === 'rabies') return 1;
    // Locked = lower priority (100)
    if (r.status === 'locked') return 100;
    // Due soon (2)
    if (r.status === 'upcoming') return 2;
    // Everything else (10)
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
    // Get priority-sorted upcoming/overdue records
    const prioritized = sortByPriority(
      records.filter(r => r.status === 'overdue' || r.status === 'upcoming'),
    );
    if (prioritized.length === 0) return null;
    return prioritized[0];
  },

  getUpcomingShortList: (records, limit = 3) => {
    const nextAction = smartHealthSelectors.getNextActionTask(records);
    return sortByPriority(
      records.filter(r => r.status === 'overdue' || r.status === 'upcoming'),
    )
      .filter(r => r.id !== nextAction?.id)
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
      history: sorted.filter(r => r.status === 'completed'),
    };
  },
};
