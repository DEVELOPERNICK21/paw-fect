import type { Pet } from '../../domain/models/Pet';
import { normalizePet } from '../../domain/models/normalizePet';
import type { PetRepository } from '../../domain/repositories/PetRepository';
import type { PetRemoteDataSource } from '../datasources/PetRemoteDataSource';
import { createPetRemoteDataSource } from '../datasources/PetRemoteDataSource';
import type { PetLocalDataSource } from '../datasources/PetLocalDataSource';
import { createPetLocalDataSource } from '../datasources/PetLocalDataSource';
import type {
  PetOutboundQueueDataSource,
  PetQueueEntry,
} from '../datasources/PetOutboundQueueDataSource';
import { createPetOutboundQueueDataSource } from '../datasources/PetOutboundQueueDataSource';

export class PetRepositoryImpl implements PetRepository {
  constructor(
    private readonly remote: PetRemoteDataSource,
    private readonly local: PetLocalDataSource,
    private readonly queue: PetOutboundQueueDataSource,
  ) {}

  private async processOutboundQueue(userId: string): Promise<void> {
    let remaining = await this.queue.getAll(userId);
    const now = Date.now();

    // Queue worker: sequentially apply due entries with exponential backoff.
    // After each success we remove the applied entry from the persisted queue.
    let i = 0;
    while (i < remaining.length) {
      const entry = remaining[i];
      const nextAttemptAt = entry.nextAttemptAt ?? 0;

      if (nextAttemptAt > now) {
        // Respect ordering: stop processing until the current entry becomes due.
        await this.queue.setAll(userId, remaining);
        return;
      }

      try {
        await this.applyQueueEntry(userId, entry);
        // Drop the successfully processed entry and start over.
        remaining = remaining.slice(i + 1);
        i = 0;
        continue;
      } catch (error) {
        const attempts = entry.attempts ?? 0;
        const nextAttempts = attempts + 1;

        // base 1s, multiplier 2, cap 5m, with small jitter
        const baseMs = 1000;
        const capMs = 5 * 60 * 1000;
        const expMs = Math.min(capMs, baseMs * Math.pow(2, attempts));
        const jitterMs = Math.floor(Math.random() * 500);
        const delayMs = expMs + jitterMs;

        const updated: typeof entry = {
          ...entry,
          attempts: nextAttempts,
          nextAttemptAt: now + delayMs,
          lastError: error instanceof Error ? error.message : 'Queue failure',
        };

        // Keep only the failed entry + the remaining tail entries.
        await this.queue.setAll(userId, [updated, ...remaining.slice(i + 1)]);
        return;
      }
    }

    await this.queue.setAll(userId, []);
  }

  private async applyQueueEntry(userId: string, entry: PetQueueEntry): Promise<void> {
    if (entry.op === 'create' && entry.pet) {
      const created = await this.remote.createPet(entry.pet);
      const normalized = normalizePet(created, userId);
      if (normalized) {
        const current = await this.local.getPets(userId);
        const next = [...current.filter(p => p.id !== normalized.id), normalized];
        await this.local.savePets(userId, next);
      }
      return;
    }
    if (entry.op === 'update' && entry.pet) {
      const updated = await this.remote.updatePet(entry.pet);
      const normalized = normalizePet(updated, userId);
      if (normalized) {
        const current = await this.local.getPets(userId);
        const next = [...current.filter(p => p.id !== normalized.id), normalized];
        await this.local.savePets(userId, next);
      }
      return;
    }
    if (entry.op === 'delete' && entry.petId) {
      await this.remote.deletePet(entry.petId);
      const current = await this.local.getPets(userId);
      const next = current.filter(p => p.id !== entry.petId);
      await this.local.savePets(userId, next);
      return;
    }
  }

  async getPets(userId: string): Promise<Pet[]> {
    // Load local first so we can protect pending local edits from being overwritten by remote snapshots.
    await this.processOutboundQueue(userId);

    const queueEntries = await this.queue.getAll(userId);
    /** Remote deletes can lag behind local removal; never resurrect pets awaiting server delete. */
    const pendingDeletePetIds = new Set(
      queueEntries
        .filter(e => e.op === 'delete' && typeof e.petId === 'string')
        .map(e => e.petId as string),
    );

    const localAfter = await this.local.getPets(userId);
    const pendingIds = new Set(
      localAfter.filter(p => (p.syncStatus ?? 'synced') !== 'synced').map(p => p.id),
    );
    try {
      const remoteList = await this.remote.fetchPets();
      const remoteNormalized = remoteList
        .map(r => normalizePet(r, userId))
        .filter((p): p is Pet => p !== null)
        .filter(p => p.userId === userId);

      // Merge rule:
      // - keep local pending/failed pets if the same id exists on the server
      // - keep remote synced pets
      // - include local pets that remote doesn't know about yet
      const mergedMap = new Map<string, Pet>();
      for (const localPet of localAfter) {
        const isPending = (localPet.syncStatus ?? 'synced') !== 'synced';
        if (isPending) {
          mergedMap.set(localPet.id, localPet);
        }
      }

      for (const remotePet of remoteNormalized) {
        if (pendingIds.has(remotePet.id)) {
          continue;
        }
        if (pendingDeletePetIds.has(remotePet.id)) {
          continue;
        }
        mergedMap.set(remotePet.id, remotePet);
      }

      for (const localPet of localAfter) {
        if (!mergedMap.has(localPet.id)) {
          mergedMap.set(localPet.id, localPet);
        }
      }

      const merged = Array.from(mergedMap.values());
      await this.local.savePets(userId, merged);
      return merged;
    } catch {
      return this.local.getPets(userId);
    }
  }

  async getPetById(userId: string, id: string): Promise<Pet | null> {
    const pets = await this.local.getPets(userId);
    const found = pets.find(pet => pet.id === id);
    if (found) {
      return found;
    }
    try {
      const remotePet = await this.remote.fetchPetById(id);
      return remotePet ? normalizePet(remotePet, userId) : null;
    } catch {
      return null;
    }
  }

  async getActivePetId(userId: string): Promise<string | null> {
    return this.local.getActivePetId(userId);
  }

  async createPet(userId: string, pet: Pet): Promise<Pet> {
    if (pet.userId !== userId) {
      throw new Error('Pet userId mismatch');
    }
    const existing = await this.local.getPets(userId);
    const next = [...existing.filter(p => p.id !== pet.id), pet];
    await this.local.savePets(userId, next);
    try {
      const created = await this.remote.createPet(pet);
      const normalized = normalizePet(created, userId);
      if (!normalized) {
        return pet;
      }
      const merged = await this.local.getPets(userId);
      const next2 = [
        ...merged.filter(p => p.id !== normalized.id),
        normalized,
      ];
      await this.local.savePets(userId, next2);
      return normalized;
    } catch {
      await this.queue.enqueue(userId, { op: 'create', pet });
      return pet;
    }
  }

  async updatePet(userId: string, pet: Pet): Promise<Pet> {
    if (pet.userId !== userId) {
      throw new Error('Pet userId mismatch');
    }
    const pets = await this.local.getPets(userId);
    const exists = pets.some(p => p.id === pet.id);
    const next = exists
      ? pets.map(p => (p.id === pet.id ? pet : p))
      : [...pets, pet];
    await this.local.savePets(userId, next);
    try {
      const updated = await this.remote.updatePet(pet);
      const normalized = normalizePet(updated, userId) ?? pet;
      const current = await this.local.getPets(userId);
      const next2 = current.some(p => p.id === normalized.id)
        ? current.map(p => (p.id === normalized.id ? normalized : p))
        : [...current, normalized];
      await this.local.savePets(userId, next2);
      return normalized;
    } catch {
      await this.queue.enqueue(userId, { op: 'update', pet });
      return pet;
    }
  }

  async deletePet(userId: string, id: string): Promise<void> {
    const pets = await this.local.getPets(userId);
    await this.local.savePets(
      userId,
      pets.filter(pet => pet.id !== id),
    );
    try {
      await this.remote.deletePet(id);
    } catch {
      await this.queue.enqueue(userId, { op: 'delete', petId: id });
    }
  }

  async setActivePet(userId: string, petId: string | null): Promise<void> {
    await this.local.setActivePetId(userId, petId);
  }
}

export const createPetRepository = (): PetRepository => {
  const remote = createPetRemoteDataSource();
  const local = createPetLocalDataSource();
  const queue = createPetOutboundQueueDataSource();
  return new PetRepositoryImpl(remote, local, queue);
};
