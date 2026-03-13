import { create } from 'zustand';
import type { Pet } from '../domain/models/Pet';
import { createPetRepository } from '../data/repositories/PetRepositoryImpl';
import { GetPets } from '../domain/usecases/GetPets';
import { CreatePet } from '../domain/usecases/CreatePet';
import { SetActivePet } from '../domain/usecases/SetActivePet';

export interface PetState {
  pets: Pet[];
  activePet: Pet | null;
  loading: boolean;
  loadPets: () => Promise<void>;
  createPet: (pet: Pet) => Promise<void>;
  setActivePet: (petId: string | null) => Promise<void>;
}

const repository = createPetRepository();
const getPetsUseCase = new GetPets(repository);
const createPetUseCase = new CreatePet(repository);
const setActivePetUseCase = new SetActivePet(repository);

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  activePet: null,
  loading: false,

  loadPets: async () => {
    set({ loading: true });
    try {
      const pets = await getPetsUseCase.execute();
      const state = get();
      const activePet =
        state.activePet &&
        pets.find(pet => pet.id === state.activePet?.id) ??
        null;

      set({ pets, activePet, loading: false });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[petStore] loadPets error', error);
      set({ loading: false });
    }
  },

  createPet: async (pet: Pet) => {
    set({ loading: true });
    try {
      const created = await createPetUseCase.execute(pet);
      const { pets } = get();
      set({ pets: [...pets, created], loading: false });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[petStore] createPet error', error);
      set({ loading: false });
    }
  },

  setActivePet: async (petId: string | null) => {
    try {
      await setActivePetUseCase.execute(petId);
      const { pets } = get();
      const activePet =
        petId != null ? pets.find(pet => pet.id === petId) ?? null : null;
      set({ activePet });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[petStore] setActivePet error', error);
    }
  },
}));

