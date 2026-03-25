import type { PetRepository } from '../repositories/PetRepository';

export class GetActivePetId {
  constructor(private readonly repository: PetRepository) {}

  async execute(userId: string): Promise<string | null> {
    return this.repository.getActivePetId(userId);
  }
}
