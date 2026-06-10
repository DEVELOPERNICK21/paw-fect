import type {
  SmartHealthHistoryLog,
  SmartHealthRecord,
} from '../../domain/models/SmartHealthRecord';
import type {
  SmartHealthQueueEntry,
  SmartHealthQueueEntryInput,
} from '../../domain/models/SmartHealthQueueEntry';
import type { SmartHealthRecordRepository } from '../../domain/repositories/SmartHealthRecordRepository';
import {
  applySmartHealthQueueOptimistic,
  stripSmartHealthSyncPending,
} from '../../domain/utils/applySmartHealthQueueOptimistic';
import { MarkSmartHealthRecordDone } from '../../domain/usecases/MarkSmartHealthRecordDone';
import { RescheduleSmartHealthRecord } from '../../domain/usecases/RescheduleSmartHealthRecord';
import { SkipSmartHealthRecord } from '../../domain/usecases/SkipSmartHealthRecord';
import type { SmartHealthLocalDataSource } from '../datasources/SmartHealthLocalDataSource';
import { createSmartHealthLocalDataSource } from '../datasources/SmartHealthLocalDataSource';
import type { SmartHealthOutboundQueueDataSource } from '../datasources/SmartHealthOutboundQueueDataSource';
import { createSmartHealthOutboundQueueDataSource } from '../datasources/SmartHealthOutboundQueueDataSource';
import type { SmartHealthRecordRemoteDataSource } from '../datasources/SmartHealthRecordRemoteDataSource';
import { createSmartHealthRecordRemoteDataSource } from '../datasources/SmartHealthRecordRemoteDataSource';
import { MockSmartHealthRecordRepository } from './MockSmartHealthRecordRepository';

const MAX_QUEUE_ATTEMPTS = 8;

export interface SmartHealthQueueHooks {
  beforeMutation?: (recordId: string) => Promise<void>;
  afterMutation?: (userId: string, petId: string) => Promise<void>;
}

export class SmartHealthRecordRepositoryImpl implements SmartHealthRecordRepository {
  private processingQueue = false;
  private markDoneUseCase: MarkSmartHealthRecordDone | null = null;
  private skipUseCase: SkipSmartHealthRecord | null = null;
  private rescheduleUseCase: RescheduleSmartHealthRecord | null = null;

  private hooks: SmartHealthQueueHooks;

  constructor(
    private readonly remote: SmartHealthRecordRemoteDataSource,
    private readonly local: SmartHealthLocalDataSource,
    private readonly queue: SmartHealthOutboundQueueDataSource,
    hooks: SmartHealthQueueHooks = {},
  ) {
    this.hooks = hooks;
  }

  setQueueHooks(hooks: SmartHealthQueueHooks): void {
    this.hooks = hooks;
  }

  private getMarkDoneUseCase(): MarkSmartHealthRecordDone {
    this.markDoneUseCase ??= new MarkSmartHealthRecordDone(this);
    return this.markDoneUseCase;
  }

  private getSkipUseCase(): SkipSmartHealthRecord {
    this.skipUseCase ??= new SkipSmartHealthRecord(this);
    return this.skipUseCase;
  }

  private getRescheduleUseCase(): RescheduleSmartHealthRecord {
    this.rescheduleUseCase ??= new RescheduleSmartHealthRecord(this);
    return this.rescheduleUseCase;
  }

  async getCachedRecords(userId: string, petId: string): Promise<SmartHealthRecord[]> {
    return this.local.getRecords(userId, petId);
  }

  async saveCachedRecords(
    userId: string,
    petId: string,
    records: SmartHealthRecord[],
  ): Promise<void> {
    await this.local.saveRecords(userId, petId, records);
  }

  async saveCachedRecordsFromServer(
    userId: string,
    petId: string,
    records: SmartHealthRecord[],
  ): Promise<void> {
    await this.local.saveRecords(userId, petId, stripSmartHealthSyncPending(records));
  }

  async mergeWithPendingQueue(
    userId: string,
    petId: string,
    records: SmartHealthRecord[],
  ): Promise<SmartHealthRecord[]> {
    const entries = await this.queue.getAll(userId);
    const forPet = entries.filter(entry => entry.petId === petId);
    return applySmartHealthQueueOptimistic(records, forPet);
  }

  async enqueueMutation(
    userId: string,
    entry: SmartHealthQueueEntryInput,
  ): Promise<SmartHealthQueueEntry> {
    return this.queue.enqueue(userId, entry);
  }

  async removeQueueEntry(userId: string, entryId: string): Promise<void> {
    await this.queue.remove(userId, entryId);
  }

  async getPendingSyncCount(userId: string): Promise<number> {
    return this.queue.count(userId);
  }

  async listByPet(userId: string, petId: string): Promise<SmartHealthRecord[]> {
    if (!this.processingQueue) {
      await this.processSyncQueue(userId);
    }

    const cached = await this.local.getRecords(userId, petId);

    try {
      const remoteRecords = await this.remote.listByPet(userId, petId);
      const stripped = stripSmartHealthSyncPending(remoteRecords);
      const merged = await this.mergeWithPendingQueue(userId, petId, stripped);
      await this.local.saveRecords(userId, petId, merged);
      return merged;
    } catch {
      if (cached.length === 0) {
        return [];
      }
      return this.mergeWithPendingQueue(userId, petId, cached);
    }
  }

  async upsertMany(records: SmartHealthRecord[]): Promise<void> {
    await this.remote.upsertMany(records);
    await this.mergeRemoteWritesIntoLocal(records);
  }

  async updateOne(record: SmartHealthRecord): Promise<void> {
    await this.remote.updateOne(record);
    await this.mergeRemoteWritesIntoLocal([record]);
  }

  async appendHistory(logs: SmartHealthHistoryLog[]): Promise<void> {
    await this.remote.appendHistory(logs);
  }

  async deleteOne(
    userId: string,
    petId: string,
    recordId: string,
  ): Promise<void> {
    await this.remote.deleteOne(userId, petId, recordId);
    const cached = await this.local.getRecords(userId, petId);
    await this.local.saveRecords(
      userId,
      petId,
      cached.filter(record => record.id !== recordId),
    );
  }

  async deleteAll(userId: string, petId: string): Promise<void> {
    await this.remote.deleteAll(userId, petId);
    await this.local.clearPet(userId, petId);
  }

  async processSyncQueue(userId: string): Promise<number> {
    this.processingQueue = true;
    try {
      return await this.processSyncQueueInternal(userId);
    } finally {
      this.processingQueue = false;
    }
  }

  private async mergeRemoteWritesIntoLocal(
    records: SmartHealthRecord[],
  ): Promise<void> {
    if (records.length === 0) {
      return;
    }
    const grouped = new Map<string, SmartHealthRecord[]>();
    for (const record of records) {
      const key = `${record.userId}:${record.petId}`;
      const list = grouped.get(key) ?? [];
      list.push(stripSmartHealthSyncPending([record])[0] ?? record);
      grouped.set(key, list);
    }

    for (const [key, incoming] of grouped) {
      const [userId, petId] = key.split(':');
      if (!userId || !petId) {
        continue;
      }
      const cached = await this.local.getRecords(userId, petId);
      const byId = new Map(cached.map(record => [record.id, record]));
      for (const record of incoming) {
        byId.set(record.id, record);
      }
      const merged = await this.mergeWithPendingQueue(
        userId,
        petId,
        Array.from(byId.values()),
      );
      await this.local.saveRecords(userId, petId, merged);
    }
  }

  private async processSyncQueueInternal(userId: string): Promise<number> {
    let remaining = await this.queue.getAll(userId);
    const now = Date.now();
    let processed = 0;

    let i = 0;
    while (i < remaining.length) {
      const entry = remaining[i]!;
      const nextAttemptAt = entry.nextAttemptAt ?? 0;
      if (nextAttemptAt > now) {
        i += 1;
        continue;
      }

      try {
        await this.applyQueueEntry(entry);
        remaining = remaining.filter(e => e.id !== entry.id);
        await this.queue.setAll(userId, remaining);
        processed += 1;
        i = 0;
      } catch (error) {
        const attempts = (entry.attempts ?? 0) + 1;
        const baseMs = 1000;
        const capMs = 5 * 60 * 1000;
        const delayMs = Math.min(capMs, baseMs * Math.pow(2, entry.attempts ?? 0));

        const updated: SmartHealthQueueEntry = {
          ...entry,
          attempts,
          nextAttemptAt: now + delayMs,
          lastError: error instanceof Error ? error.message : 'Queue failure',
        };

        if (attempts >= MAX_QUEUE_ATTEMPTS) {
          remaining = remaining.filter(e => e.id !== entry.id);
          await this.queue.setAll(userId, remaining);
          i = 0;
          continue;
        }

        remaining = [updated, ...remaining.filter(e => e.id !== entry.id)];
        await this.queue.setAll(userId, remaining);
        return processed;
      }
    }

    await this.queue.setAll(userId, remaining);
    return processed;
  }

  private async applyQueueEntry(entry: SmartHealthQueueEntry): Promise<void> {
    await this.hooks.beforeMutation?.(entry.recordId);

    switch (entry.op) {
      case 'markDone':
        await this.getMarkDoneUseCase().execute(
          entry.record,
          entry.completedDate,
          entry.petDateOfBirth,
        );
        break;
      case 'skip':
        if (!entry.reason) {
          throw new Error('Skip reason is required.');
        }
        await this.getSkipUseCase().execute(
          entry.record,
          entry.reason,
          entry.petDateOfBirth,
        );
        break;
      case 'reschedule':
        if (!entry.newDueDate) {
          throw new Error('New due date is required.');
        }
        await this.getRescheduleUseCase().execute(
          entry.record,
          entry.newDueDate,
          entry.petDateOfBirth,
        );
        break;
      default:
        break;
    }

    await this.hooks.afterMutation?.(entry.record.userId, entry.petId);
  }
}

export type SmartHealthRecordRepositoryAdapter = 'firebase' | 'mock';

interface CreateSmartHealthRecordRepositoryOptions {
  adapter?: SmartHealthRecordRepositoryAdapter;
}

export const createSmartHealthRecordRepository = (
  options?: CreateSmartHealthRecordRepositoryOptions,
): SmartHealthRecordRepository => {
  if (options?.adapter === 'mock') {
    return new MockSmartHealthRecordRepository();
  }
  const remote = createSmartHealthRecordRemoteDataSource();
  const local = createSmartHealthLocalDataSource();
  const queue = createSmartHealthOutboundQueueDataSource();
  return new SmartHealthRecordRepositoryImpl(remote, local, queue);
};

export function configureSmartHealthQueueHooks(
  repository: SmartHealthRecordRepository,
  hooks: SmartHealthQueueHooks,
): void {
  if (repository instanceof SmartHealthRecordRepositoryImpl) {
    repository.setQueueHooks(hooks);
  }
}
