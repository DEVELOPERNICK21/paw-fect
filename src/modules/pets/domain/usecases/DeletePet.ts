import type { PetRepository } from '../repositories/PetRepository';

export class DeletePet {
  constructor(private readonly repository: PetRepository) {}

  async execute(id: string): Promise<void> {
    return this.repository.deletePet(id);
  }
}

