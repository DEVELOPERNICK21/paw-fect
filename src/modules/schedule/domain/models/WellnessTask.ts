export type PersistedWellnessTaskStatus = 'done' | 'skipped';

export interface PersistedWellnessTask {
  status: PersistedWellnessTaskStatus;
  updatedAt: string;
}

export type WellnessTaskMap = Record<string, PersistedWellnessTask>;

export interface WellnessStreakRecord {
  count: number;
  lastCompletedDate: string | null;
}
