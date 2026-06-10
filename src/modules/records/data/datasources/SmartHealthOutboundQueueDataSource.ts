import type {
  SmartHealthQueueEntry,
  SmartHealthQueueEntryInput,
  SmartHealthQueueOp,
} from '../../domain/models/SmartHealthQueueEntry';
import { storageService } from '../../../../infrastructure/storage/storageService';
import { createLocalId } from '../../../../shared/utils/id';

export type { SmartHealthQueueEntry, SmartHealthQueueEntryInput, SmartHealthQueueOp };

const queueKey = (userId: string): string => `smartHealthSyncQueue:${userId}`;

export interface SmartHealthOutboundQueueDataSource {
  getAll(userId: string): Promise<SmartHealthQueueEntry[]>;
  setAll(userId: string, entries: SmartHealthQueueEntry[]): Promise<void>;
  enqueue(
    userId: string,
    entry: SmartHealthQueueEntryInput,
  ): Promise<SmartHealthQueueEntry>;
  remove(userId: string, entryId: string): Promise<void>;
  count(userId: string): Promise<number>;
}

class SmartHealthOutboundQueueDataSourceImpl
  implements SmartHealthOutboundQueueDataSource
{
  async getAll(userId: string): Promise<SmartHealthQueueEntry[]> {
    const raw = await storageService.getItem<unknown>(queueKey(userId));
    if (!Array.isArray(raw)) {
      return [];
    }
    const out: SmartHealthQueueEntry[] = [];
    for (const item of raw) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      const o = item as Record<string, unknown>;
      if (
        typeof o.id !== 'string' ||
        (o.op !== 'markDone' && o.op !== 'skip' && o.op !== 'reschedule') ||
        typeof o.petId !== 'string' ||
        typeof o.recordId !== 'string' ||
        !o.record ||
        typeof o.record !== 'object'
      ) {
        continue;
      }
      out.push({
        id: o.id,
        op: o.op,
        petId: o.petId,
        recordId: o.recordId,
        record: o.record as SmartHealthQueueEntry['record'],
        completedDate:
          typeof o.completedDate === 'string' ? o.completedDate : undefined,
        petDateOfBirth:
          typeof o.petDateOfBirth === 'string' ? o.petDateOfBirth : undefined,
        reason: typeof o.reason === 'string' ? o.reason : undefined,
        newDueDate: typeof o.newDueDate === 'string' ? o.newDueDate : undefined,
        attempts:
          typeof o.attempts === 'number' && Number.isFinite(o.attempts)
            ? o.attempts
            : 0,
        nextAttemptAt:
          typeof o.nextAttemptAt === 'number' && Number.isFinite(o.nextAttemptAt)
            ? o.nextAttemptAt
            : 0,
        lastError: typeof o.lastError === 'string' ? o.lastError : undefined,
        enqueuedAt:
          typeof o.enqueuedAt === 'string'
            ? o.enqueuedAt
            : new Date().toISOString(),
      });
    }
    return out;
  }

  async setAll(userId: string, entries: SmartHealthQueueEntry[]): Promise<void> {
    await storageService.setItem(queueKey(userId), entries);
  }

  async enqueue(
    userId: string,
    entry: SmartHealthQueueEntryInput,
  ): Promise<SmartHealthQueueEntry> {
    const all = await this.getAll(userId);
    const existing = all.find(
      e => e.op === entry.op && e.recordId === entry.recordId,
    );
    if (existing) {
      return existing;
    }
    const queued: SmartHealthQueueEntry = {
      ...entry,
      id: createLocalId('shq'),
      enqueuedAt: new Date().toISOString(),
      attempts: 0,
      nextAttemptAt: Date.now(),
    };
    all.push(queued);
    await this.setAll(userId, all);
    return queued;
  }

  async remove(userId: string, entryId: string): Promise<void> {
    const all = await this.getAll(userId);
    await this.setAll(
      userId,
      all.filter(entry => entry.id !== entryId),
    );
  }

  async count(userId: string): Promise<number> {
    const all = await this.getAll(userId);
    return all.length;
  }
}

export const createSmartHealthOutboundQueueDataSource =
  (): SmartHealthOutboundQueueDataSource =>
    new SmartHealthOutboundQueueDataSourceImpl();
