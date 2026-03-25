import type { Pet } from '../models/Pet';

export interface PetRepository {
  getPets(userId: string): Promise<Pet[]>;
  getPetById(userId: string, id: string): Promise<Pet | null>;
  getActivePetId(userId: string): Promise<string | null>;
  createPet(userId: string, pet: Pet): Promise<Pet>;
  updatePet(userId: string, pet: Pet): Promise<Pet>;
  deletePet(userId: string, id: string): Promise<void>;
  setActivePet(userId: string, petId: string | null): Promise<void>;
}
