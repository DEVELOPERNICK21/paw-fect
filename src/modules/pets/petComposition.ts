/**
 * Composition root for the pets module: wires repository implementations to use cases.
 */
import { createPetRepository } from './data/repositories/PetRepositoryImpl';
import { GetPets } from './domain/usecases/GetPets';
import { GetPetById } from './domain/usecases/GetPetById';
import { GetActivePetId } from './domain/usecases/GetActivePetId';
import { CreatePet } from './domain/usecases/CreatePet';
import { UpdatePet } from './domain/usecases/UpdatePet';
import { DeletePet } from './domain/usecases/DeletePet';
import { SetActivePet } from './domain/usecases/SetActivePet';
import { CreatePetProfile } from './domain/usecases/CreatePetProfile';

const repository = createPetRepository();

export const petComposition = {
  getPets: new GetPets(repository),
  getPetById: new GetPetById(repository),
  getActivePetId: new GetActivePetId(repository),
  createPet: new CreatePet(repository),
  updatePet: new UpdatePet(repository),
  deletePet: new DeletePet(repository),
  setActivePet: new SetActivePet(repository),
  createPetProfile: new CreatePetProfile(),
} as const;
