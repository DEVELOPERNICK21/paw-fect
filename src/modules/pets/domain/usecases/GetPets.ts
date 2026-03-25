import type { Pet } from '../models/Pet';
import type { PetRepository } from '../repositories/PetRepository';

export class GetPets {
  constructor(private readonly repository: PetRepository) {}

  async execute(userId: string): Promise<Pet[]> {
    return this.repository.getPets(userId);
  }
}
