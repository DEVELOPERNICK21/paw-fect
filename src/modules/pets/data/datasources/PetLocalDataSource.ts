import type { Pet } from '../../domain/models/Pet';
import { normalizePetsList } from '../../domain/models/normalizePet';
import { storageService } from '../../../../infrastructure/storage/storageService';

/** Legacy global keys (pre per-user namespacing). */
const LEGACY_PETS_KEY = 'pets';
const LEGACY_ACTIVE_PET_ID_KEY = 'activePetId';

const petsKey = (userId: string): string => `pets:${userId}`;
const activePetKey = (userId: string): string => `activePetId:${userId}`;

export interface PetLocalDataSource {
  getPets(userId: string): Promise<Pet[]>;
  savePets(userId: string, pets: Pet[]): Promise<void>;
  getActivePetId(userId: string): Promise<string | null>;
  setActivePetId(userId: string, petId: string | null): Promise<void>;
}

class PetLocalDataSourceImpl implements PetLocalDataSource {
  private async migrateLegacyIfNeeded(userId: string): Promise<void> {
    const legacyPets = await storageService.getItem<unknown>(LEGACY_PETS_KEY);
    if (legacyPets === null) {
      return;
    }

    const key = petsKey(userId);
    const rawNamespaced = await storageService.getItem<unknown>(key);
    if (
      Array.isArray(rawNamespaced) &&
      rawNamespaced.length > 0
    ) {
      return;
    }

    const normalized = normalizePetsList(legacyPets, userId);
    await storageService.setItem(key, normalized);

    const legacyActive = await storageService.getItem<string | null>(
      LEGACY_ACTIVE_PET_ID_KEY,
    );
    if (legacyActive != null) {
      await storageService.setItem(activePetKey(userId), legacyActive);
    }

    await storageService.removeItem(LEGACY_PETS_KEY);
    await storageService.removeItem(LEGACY_ACTIVE_PET_ID_KEY);
  }

  async getPets(userId: string): Promise<Pet[]> {
    await this.migrateLegacyIfNeeded(userId);
    const key = petsKey(userId);
    const raw = await storageService.getItem<unknown>(key);
    if (raw === null) {
      return [];
    }
    return normalizePetsList(raw, userId);
  }

  async savePets(userId: string, pets: Pet[]): Promise<void> {
    await storageService.setItem(petsKey(userId), pets);
  }

  async getActivePetId(userId: string): Promise<string | null> {
    await this.migrateLegacyIfNeeded(userId);
    const id = await storageService.getItem<string | null>(activePetKey(userId));
    return id ?? null;
  }

  async setActivePetId(userId: string, petId: string | null): Promise<void> {
    const key = activePetKey(userId);
    if (petId == null) {
      await storageService.removeItem(key);
    } else {
      await storageService.setItem(key, petId);
    }
  }
}

export const createPetLocalDataSource = (): PetLocalDataSource =>
  new PetLocalDataSourceImpl();
