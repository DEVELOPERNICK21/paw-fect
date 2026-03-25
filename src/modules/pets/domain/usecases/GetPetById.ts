import type { Pet } from '../models/Pet';
import type { PetRepository } from '../repositories/PetRepository';

export class GetPetById {
  constructor(private readonly repository: PetRepository) {}

  async execute(userId: string, id: string): Promise<Pet | null> {
    return this.repository.getPetById(userId, id);
  }
}
