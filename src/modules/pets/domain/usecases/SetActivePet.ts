import type { PetRepository } from '../repositories/PetRepository';

export class SetActivePet {
  constructor(private readonly repository: PetRepository) {}

  async execute(petId: string | null): Promise<void> {
    return this.repository.setActivePet(petId);
  }
}

