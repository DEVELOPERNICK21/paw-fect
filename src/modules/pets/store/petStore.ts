import { create } from 'zustand';

import { useAuthStore } from '../../auth/store/authStore';
import { petComposition } from '../petComposition';
import type { Pet } from '../domain/models/Pet';
import type { PetType } from '../domain/models/Pet';
import type { CreatePetProfileResult as CreatePetProfileUseCaseResult } from '../domain/usecases/CreatePetProfile';

const pc = petComposition;

function requireUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

interface CreatePetProfileFormInput {
  name: string;
  type: PetType;
  breed?: string;
  gender?: Pet['gender'];
  dob?: string;
  lifestyle?: Pet['lifestyle'];
  region?: Pet['region'];
  photo?: string;
}

interface CreatePetProfileStoreResult {
  success: boolean;
  error?: string;
}

export interface PetState {
  pets: Pet[];
  activePet: Pet | null;
  loading: boolean;
  loadError: string | null;
  reset: () => void;
  loadPets: () => Promise<void>;
  createPet: (pet: Pet) => Promise<void>;
  createPetProfile: (
    input: CreatePetProfileFormInput,
  ) => Promise<CreatePetProfileStoreResult>;
  updatePet: (pet: Pet) => Promise<{ success: boolean; error?: string }>;
  deletePet: (id: string) => Promise<{ success: boolean; error?: string }>;
  getPetById: (id: string) => Promise<Pet | null>;
  setActivePet: (petId: string | null) => Promise<void>;
}

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  activePet: null,
  loading: false,
  loadError: null,
  reset: () =>
    set({ pets: [], activePet: null, loading: false, loadError: null }),

  loadPets: async () => {
    const userId = requireUserId();
    if (!userId) {
      set({
        pets: [],
        activePet: null,
        loading: false,
        loadError: 'Please sign in again.',
      });
      return;
    }

    set({ loading: true, loadError: null });
    try {
      const pets = await pc.getPets.execute(userId);
      let activePetId = await pc.getActivePetId.execute(userId);

      let activePet: Pet | null =
        activePetId != null
          ? pets.find(pet => pet.id === activePetId) ?? null
          : null;

      if (activePet == null && pets.length > 0) {
        activePet = pets[0] ?? null;
        activePetId = activePet?.id ?? null;
        await pc.setActivePet.execute(userId, activePetId);
      }

      if (pets.length === 0) {
        await pc.setActivePet.execute(userId, null);
        activePet = null;
      }

      set({ pets, activePet, loading: false, loadError: null });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[petStore] loadPets error', error);
      set({
        loading: false,
        loadError: 'Unable to load pets. Please try again.',
      });
    }
  },

  createPet: async (pet: Pet) => {
    const userId = requireUserId();
    if (!userId) {
      return;
    }
    try {
      const created = await pc.createPet.execute(userId, pet);
      const { pets } = get();
      set({
        pets: [...pets.filter(p => p.id !== created.id), created],
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[petStore] createPet error', error);
    }
  },

  createPetProfile: async (input: CreatePetProfileFormInput) => {
    const userId = requireUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Please sign in again to add a pet.',
      };
    }

    const result: CreatePetProfileUseCaseResult = pc.createPetProfile.execute({
      ...input,
      userId,
    });
    if (!result.ok) {
      return { success: false, error: result.errorMessage };
    }
    await get().createPet(result.pet);
    await get().setActivePet(result.pet.id);
    return { success: true };
  },

  updatePet: async (pet: Pet) => {
    const userId = requireUserId();
    if (!userId || pet.userId !== userId) {
      return { success: false, error: 'Please sign in again to update a pet.' };
    }
    const next: Pet = {
      ...pet,
      updatedAt: new Date().toISOString(),
      // Any user edit creates a local pending state until sync reconciliation updates it.
      syncStatus: 'pending',
    };
    try {
      const updated = await pc.updatePet.execute(userId, next);
      const { activePet } = get();
      set({
        pets: get().pets.map(p => (p.id === updated.id ? updated : p)),
        activePet:
          activePet?.id === updated.id ? updated : activePet,
      });
      return { success: true };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[petStore] updatePet error', error);
      return {
        success: false,
        error: 'Unable to save changes. Try again.',
      };
    }
  },

  deletePet: async (id: string) => {
    const userId = requireUserId();
    if (!userId) {
      return { success: false, error: 'Please sign in again.' };
    }
    const { activePet, pets: prevPets } = get();
    const wasActive = activePet?.id === id;

    try {
      await pc.deletePet.execute(userId, id);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[petStore] deletePet error', error);
      return {
        success: false,
        error: 'Unable to delete pet. Try again.',
      };
    }

    const pets = prevPets.filter(p => p.id !== id);
    let nextActive: Pet | null = activePet;

    if (wasActive) {
      const fallback = pets[0] ?? null;
      await pc.setActivePet.execute(userId, fallback?.id ?? null);
      nextActive = fallback;
    } else if (activePet) {
      nextActive = pets.find(p => p.id === activePet.id) ?? null;
    }

    set({ pets, activePet: nextActive });
    return { success: true };
  },

  getPetById: async (id: string) => {
    const userId = requireUserId();
    if (!userId) {
      return null;
    }
    return pc.getPetById.execute(userId, id);
  },

  setActivePet: async (petId: string | null) => {
    const userId = requireUserId();
    if (!userId) {
      return;
    }
    try {
      await pc.setActivePet.execute(userId, petId);
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
