import type { Pet } from '../../domain/models/Pet';
import { storageService } from '../../../../infrastructure/storage/storageService';

const PETS_STORAGE_KEY = 'pets';
const ACTIVE_PET_ID_KEY = 'activePetId';

export interface PetLocalDataSource {
  getPets(): Promise<Pet[]>;
  savePets(pets: Pet[]): Promise<void>;
  getActivePetId(): Promise<string | null>;
  setActivePetId(petId: string | null): Promise<void>;
}

class PetLocalDataSourceImpl implements PetLocalDataSource {
  async getPets(): Promise<Pet[]> {
    const pets = await storageService.getItem<Pet[]>(PETS_STORAGE_KEY);
    return pets ?? [];
  }

  async savePets(pets: Pet[]): Promise<void> {
    await storageService.setItem(PETS_STORAGE_KEY, pets);
  }

  async getActivePetId(): Promise<string | null> {
    const id = await storageService.getItem<string | null>(ACTIVE_PET_ID_KEY);
    return id ?? null;
  }

  async setActivePetId(petId: string | null): Promise<void> {
    if (petId == null) {
      await storageService.removeItem(ACTIVE_PET_ID_KEY);
    } else {
      await storageService.setItem(ACTIVE_PET_ID_KEY, petId);
    }
  }
}

export const createPetLocalDataSource = (): PetLocalDataSource =>
  new PetLocalDataSourceImpl();

