import type { Pet } from '../../domain/models/Pet';
import type { PetRepository } from '../../domain/repositories/PetRepository';
import type { PetRemoteDataSource } from '../datasources/PetRemoteDataSource';
import {
  createPetRemoteDataSource,
} from '../datasources/PetRemoteDataSource';
import type { PetLocalDataSource } from '../datasources/PetLocalDataSource';
import {
  createPetLocalDataSource,
} from '../datasources/PetLocalDataSource';

export class PetRepositoryImpl implements PetRepository {
  constructor(
    private readonly remote: PetRemoteDataSource,
    private readonly local: PetLocalDataSource,
  ) {}

  async getPets(): Promise<Pet[]> {
    const cached = await this.local.getPets();
    if (cached.length > 0) {
      return cached;
    }

    const remotePets = await this.remote.fetchPets();
    await this.local.savePets(remotePets);
    return remotePets;
  }

  async getPetById(id: string): Promise<Pet | null> {
    const pets = await this.getPets();
    const found = pets.find(pet => pet.id === id) ?? null;
    if (found) {
      return found;
    }

    return this.remote.fetchPetById(id);
  }

  async createPet(pet: Pet): Promise<Pet> {
    const created = await this.remote.createPet(pet);
    const pets = await this.local.getPets();
    await this.local.savePets([...pets, created]);
    return created;
  }

  async updatePet(pet: Pet): Promise<Pet> {
    const updated = await this.remote.updatePet(pet);
    const pets = await this.local.getPets();
    const next = pets.map(existing =>
      existing.id === updated.id ? updated : existing,
    );
    await this.local.savePets(next);
    return updated;
  }

  async deletePet(id: string): Promise<void> {
    await this.remote.deletePet(id);
    const pets = await this.local.getPets();
    const next = pets.filter(pet => pet.id !== id);
    await this.local.savePets(next);
  }

  async setActivePet(petId: string | null): Promise<void> {
    await this.local.setActivePetId(petId);
  }
}

export const createPetRepository = (): PetRepository => {
  const remote = createPetRemoteDataSource();
  const local = createPetLocalDataSource();
  return new PetRepositoryImpl(remote, local);
};

