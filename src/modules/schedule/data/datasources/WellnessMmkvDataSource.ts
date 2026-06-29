import {
  mmkvDelete,
  mmkvGetAllKeys,
  mmkvGetJson,
  mmkvSetJson,
} from '../../../../infrastructure/storage/mmkvStorage';
import type {
  PersistedWellnessTaskStatus,
  WellnessStreakRecord,
  WellnessTaskMap,
} from '../../domain/models/WellnessTask';
import type { ScheduleCompletionRecord } from '../../domain/repositories/ScheduleRepository';

const TASK_RETENTION_DAYS = 30;
const TASKS_KEY_PREFIX = 'tasks_';
const TASKS_INDEX_PREFIX = 'tasks_index_';

export type { WellnessTaskMap, WellnessStreakRecord, PersistedWellnessTaskStatus };

function tasksKey(petId: string, date: string): string {
  return `${TASKS_KEY_PREFIX}${petId}_${date}`;
}

function tasksIndexKey(petId: string): string {
  return `${TASKS_INDEX_PREFIX}${petId}`;
}

function shiftIsoDate(date: string, deltaDays: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(year, (month ?? 1) - 1, day ?? 1);
  next.setDate(next.getDate() + deltaDays);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
}

function parseTasksKeyDate(key: string): string | null {
  const match = key.match(/^tasks_[^_]+_(\d{4}-\d{2}-\d{2})$/);
  return match?.[1] ?? null;
}

/** Removes task maps older than 30 days for the given pet. */
export function pruneOldTaskEntries(petId: string, today: string): void {
  const cutoff = shiftIsoDate(today, -TASK_RETENTION_DAYS);
  const index = mmkvGetJson<string[]>(tasksIndexKey(petId)) ?? [];
  const kept: string[] = [];

  for (const date of index) {
    if (date < cutoff) {
      mmkvDelete(tasksKey(petId, date));
    } else {
      kept.push(date);
    }
  }

  for (const key of mmkvGetAllKeys()) {
    if (!key.startsWith(`${TASKS_KEY_PREFIX}${petId}_`)) {
      continue;
    }
    const date = parseTasksKeyDate(key);
    if (date != null && date < cutoff) {
      mmkvDelete(key);
    }
  }

  mmkvSetJson(tasksIndexKey(petId), kept);
}

/** Loads persisted task statuses for a pet on a given date. */
export function getWellnessTasks(
  petId: string,
  date: string,
  today: string,
): WellnessTaskMap {
  pruneOldTaskEntries(petId, today);
  return mmkvGetJson<WellnessTaskMap>(tasksKey(petId, date)) ?? {};
}

/** Persists a single task status and updates the date index. */
export function saveWellnessTask(
  petId: string,
  date: string,
  blockId: string,
  status: PersistedWellnessTaskStatus,
  today: string,
): void {
  pruneOldTaskEntries(petId, today);
  const key = tasksKey(petId, date);
  const map = mmkvGetJson<WellnessTaskMap>(key) ?? {};
  map[blockId] = { status, updatedAt: new Date().toISOString() };
  mmkvSetJson(key, map);

  const index = mmkvGetJson<string[]>(tasksIndexKey(petId)) ?? [];
  if (!index.includes(date)) {
    index.push(date);
    index.sort();
    mmkvSetJson(tasksIndexKey(petId), index);
  }
}

/** Seeds MMKV from legacy AsyncStorage block states when empty. */
export function seedTasksFromBlockStates(
  petId: string,
  date: string,
  blockStates: Record<string, ScheduleCompletionRecord>,
  today: string,
): WellnessTaskMap {
  const existing = getWellnessTasks(petId, date, today);
  if (Object.keys(existing).length > 0) {
    return existing;
  }

  const seeded: WellnessTaskMap = {};
  for (const [blockId, state] of Object.entries(blockStates)) {
    if (state.completedAt != null) {
      seeded[blockId] = { status: 'done', updatedAt: state.completedAt };
    }
  }

  if (Object.keys(seeded).length > 0) {
    mmkvSetJson(tasksKey(petId, date), seeded);
    const index = mmkvGetJson<string[]>(tasksIndexKey(petId)) ?? [];
    if (!index.includes(date)) {
      index.push(date);
      index.sort();
      mmkvSetJson(tasksIndexKey(petId), index);
    }
  }

  return seeded;
}

/** Reads streak count for a pet from MMKV. */
export function getWellnessStreak(petId: string): WellnessStreakRecord {
  return (
    mmkvGetJson<WellnessStreakRecord>(`streak_${petId}`) ?? {
      count: 0,
      lastCompletedDate: null,
    }
  );
}

/** Writes streak count for a pet to MMKV. */
export function saveWellnessStreak(
  petId: string,
  record: WellnessStreakRecord,
): void {
  mmkvSetJson(`streak_${petId}`, record);
}

/** Reads relaxed mode preference for a user. */
export function getRelaxedMode(userId: string): boolean {
  return mmkvGetJson<boolean>(`relaxedMode_${userId}`) ?? false;
}

/** Persists relaxed mode preference for a user. */
export function setRelaxedMode(userId: string, enabled: boolean): void {
  mmkvSetJson(`relaxedMode_${userId}`, enabled);
}
