import type { Pet } from '../../domain/models/Pet';
import { storageService } from '../../../../infrastructure/storage/storageService';
import { createLocalId } from '../../../../shared/utils/id';

export type PetQueueOp = 'create' | 'update' | 'delete';

export interface PetQueueEntry {
  id: string;
  op: PetQueueOp;
  pet?: Pet;
  petId?: string;
  /**
   * Exponential backoff metadata (local-only).
   * When nextAttemptAt is in the future, the queue worker must not retry.
   */
  attempts?: number;
  nextAttemptAt?: number; // epoch ms
  lastError?: string;
}

const queueKey = (userId: string): string => `petSyncQueue:${userId}`;

export interface PetOutboundQueueDataSource {
  getAll(userId: string): Promise<PetQueueEntry[]>;
  setAll(userId: string, entries: PetQueueEntry[]): Promise<void>;
  enqueue(userId: string, entry: Omit<PetQueueEntry, 'id'>): Promise<void>;
}

class PetOutboundQueueDataSourceImpl implements PetOutboundQueueDataSource {
  async getAll(userId: string): Promise<PetQueueEntry[]> {
    const raw = await storageService.getItem<unknown>(queueKey(userId));
    if (!Array.isArray(raw)) {
      return [];
    }
    const out: PetQueueEntry[] = [];
    for (const item of raw) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      const o = item as Record<string, unknown>;
      if (typeof o.id !== 'string' || (o.op !== 'create' && o.op !== 'update' && o.op !== 'delete')) {
        continue;
      }
      const attempts =
        typeof o.attempts === 'number' && Number.isFinite(o.attempts)
          ? o.attempts
          : 0;
      const nextAttemptAt =
        typeof o.nextAttemptAt === 'number' && Number.isFinite(o.nextAttemptAt)
          ? o.nextAttemptAt
          : 0;
      out.push({
        id: o.id,
        op: o.op,
        pet: o.pet as Pet | undefined,
        petId: typeof o.petId === 'string' ? o.petId : undefined,
        attempts,
        nextAttemptAt,
        lastError: typeof o.lastError === 'string' ? o.lastError : undefined,
      });
    }
    return out;
  }

  async setAll(userId: string, entries: PetQueueEntry[]): Promise<void> {
    await storageService.setItem(queueKey(userId), entries);
  }

  async enqueue(
    userId: string,
    entry: Omit<PetQueueEntry, 'id'>,
  ): Promise<void> {
    const all = await this.getAll(userId);
    all.push({
      ...entry,
      id: createLocalId('pq'),
      attempts: 0,
      nextAttemptAt: Date.now(),
    });
    await this.setAll(userId, all);
  }
}

export const createPetOutboundQueueDataSource =
  (): PetOutboundQueueDataSource => new PetOutboundQueueDataSourceImpl();
