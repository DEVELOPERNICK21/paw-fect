import type { Pet } from '../models/Pet';
import type { PetRepository } from '../repositories/PetRepository';

export class CreatePet {
  constructor(private readonly repository: PetRepository) {}

  async execute(pet: Pet): Promise<Pet> {
    return this.repository.createPet(pet);
  }
}

