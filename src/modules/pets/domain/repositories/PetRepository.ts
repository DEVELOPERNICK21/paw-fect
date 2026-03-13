import type { Pet } from '../models/Pet';

export interface PetRepository {
  getPets(): Promise<Pet[]>;
  getPetById(id: string): Promise<Pet | null>;
  createPet(pet: Pet): Promise<Pet>;
  updatePet(pet: Pet): Promise<Pet>;
  deletePet(id: string): Promise<void>;
  setActivePet(petId: string | null): Promise<void>;
}

