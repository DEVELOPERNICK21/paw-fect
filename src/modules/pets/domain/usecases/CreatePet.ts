import type { Pet } from '../models/Pet';
import type { PetCreatedEventPort } from '../ports/PetCreatedEventPort';
import type { PetRepository } from '../repositories/PetRepository';

export class CreatePet {
  constructor(
    private readonly repository: PetRepository,
    private readonly events?: PetCreatedEventPort,
  ) {}

  async execute(userId: string, pet: Pet): Promise<Pet> {
    const created = await this.repository.createPet(userId, pet);
    // Only reached if the repository accepted the pet: a failure rejects above.
    this.events?.emit({
      type: 'pet-created',
      petId: created.id,
      petName: created.name,
      petType: created.type,
    });
    return created;
  }
}
