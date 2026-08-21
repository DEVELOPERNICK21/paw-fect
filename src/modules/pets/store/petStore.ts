import { create } from 'zustand';

import {
  getAppSessionMaxPets,
  getAppSessionUserId,
} from '../../../shared/session/appSessionPorts';
import { getPetAccess } from '../../../shared/subscription/petAccess';
import { getPetCoordinationPorts } from './petCoordinationPorts';
import { requestNotificationResync } from '../../../infrastructure/notifications/requestNotificationResync';
import { petComposition } from '../petComposition';
import type { Pet } from '../domain/models/Pet';
import type { PetType } from '../domain/models/Pet';
import type { PetHealthMilestones } from '../domain/ports/PetHealthCoordinationPort';
import type { CreatePetProfileResult as CreatePetProfileUseCaseResult } from '../domain/usecases/CreatePetProfile';
import type { PetPhotoEncodeRequest } from '../domain/ports/PetPhotoEncoder';
import type { PreparePetPhotoResult } from '../domain/usecases/PreparePetPhoto';
import type { PetHealthCardViewModel } from '../domain/models/PetHealthCardViewModel';

const pc = petComposition;

function requireUserId(): string | null {
  return getAppSessionUserId();
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
  lastDewormingDate?: string;
  lastVaccinationDate?: string;
  lastRabiesDate?: string;
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
  resyncDailyRoutineNotifications: () => Promise<void>;
  resyncCareNotifications: () => Promise<void>;
  loadPets: () => Promise<void>;
  createPet: (pet: Pet) => Promise<void>;
  createPetProfile: (
    input: CreatePetProfileFormInput,
  ) => Promise<CreatePetProfileStoreResult>;
  updatePet: (
    pet: Pet,
    options?: {
      lastDewormingDate?: string;
      lastVaccinationDate?: string;
      lastRabiesDate?: string;
    },
  ) => Promise<{ success: boolean; error?: string }>;
  deletePet: (id: string) => Promise<{ success: boolean; error?: string }>;
  getPetById: (id: string) => Promise<Pet | null>;
  setActivePet: (petId: string | null) => Promise<void>;
  /**
   * Reads last completed health milestones for a pet via the coordination port.
   * UI uses this for prefilling edit forms; it never inspects records data shapes.
   */
  getLastHealthMilestones: (petId: string) => Promise<PetHealthMilestones>;
  pickPetPhoto: (
    source: 'camera' | 'library',
  ) => Promise<PetPhotoEncodeRequest | null>;
  preparePetPhoto: (
    request: PetPhotoEncodeRequest,
  ) => Promise<PreparePetPhotoResult>;
  buildHealthCardViewModel: (
    petId: string,
  ) => Promise<PetHealthCardViewModel>;
}

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  activePet: null,
  loading: false,
  loadError: null,
  /** Clears pet state; keeps loading true until the next loadPets completes. */
  reset: () =>
    set({ pets: [], activePet: null, loading: true, loadError: null }),

  resyncDailyRoutineNotifications: async () => {
    const pets = get().pets;
    try {
      await pc.cancelDailyRoutineNotificationsForPets(pets);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[petStore] resyncDailyRoutineNotifications error', error);
    }
  },

  resyncCareNotifications: async () => {
    const userId = requireUserId();
    if (!userId) {
      return;
    }
    const pets = get().pets;
    if (pets.length === 0) {
      return;
    }
    try {
      await requestNotificationResync();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[petStore] resyncCareNotifications error', error);
    }
  },

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

    set({ loading: get().pets.length === 0, loadError: null });
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
      void requestNotificationResync().catch(() => {});
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
      const next = [...pets.filter(p => p.id !== created.id), created];
      set({ pets: next });
      void pc.cancelDailyRoutineNotificationsForPet(created.id).catch(() => {});
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

    const maxPets = getAppSessionMaxPets();
    if (get().pets.length >= maxPets) {
      return { success: false, error: 'PET_LIMIT' };
    }

    const result: CreatePetProfileUseCaseResult = pc.createPetProfile.execute({
      ...input,
      userId,
    });
    if (!result.ok) {
      return { success: false, error: result.errorMessage };
    }

    const dateOfBirth = result.pet.dob?.trim();
    if (!dateOfBirth) {
      return {
        success: false,
        error: "Add your pet's birthday first",
      };
    }

    await get().createPet(result.pet);
    await get().setActivePet(result.pet.id);

    // Bootstrap health schedule for new pet
    await getPetCoordinationPorts().bootstrapPetHealthSchedule({
      petId: result.pet.id,
      petType: result.pet.type,
      dateOfBirth,
      region: result.pet.region,
      lifestyleType: result.pet.lifestyle?.type,
      lifestyleRiskLevel: result.pet.lifestyle?.riskLevel,
      lastDewormingDate: input.lastDewormingDate,
      lastVaccinationDate: input.lastVaccinationDate,
      lastRabiesDate: input.lastRabiesDate,
    });

    return { success: true };
  },

  updatePet: async (
    pet: Pet,
    options?: {
      lastDewormingDate?: string;
      lastVaccinationDate?: string;
      lastRabiesDate?: string;
    },
  ) => {
    const userId = requireUserId();
    if (!userId || pet.userId !== userId) {
      return { success: false, error: 'Please sign in again to update a pet.' };
    }
    const maxPets = getAppSessionMaxPets();
    const { pets } = get();
    if (getPetAccess(pets, maxPets, pet.id) === 'read_only') {
      return {
        success: false,
        error:
          'This pet is view-only on your current plan. Upgrade or remove another pet to edit.',
      };
    }
    const dateOfBirth = pet.dob?.trim();
    if (!dateOfBirth) {
      return {
        success: false,
        error: "Add your pet's birthday first",
      };
    }
    const next: Pet = {
      ...pet,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
    };
    try {
      const updated = await pc.updatePet.execute(userId, next);
      const { activePet } = get();
      const nextPets = get().pets.map(p => (p.id === updated.id ? updated : p));
      set({
        pets: nextPets,
        activePet: activePet?.id === updated.id ? updated : activePet,
      });
      void pc.cancelDailyRoutineNotificationsForPet(updated.id).catch(() => {});

      // Re-bootstrap health schedule when pet profile is saved
      await getPetCoordinationPorts().bootstrapPetHealthSchedule({
        petId: updated.id,
        petType: updated.type,
        dateOfBirth,
        region: updated.region,
        lifestyleType: updated.lifestyle?.type,
        lifestyleRiskLevel: updated.lifestyle?.riskLevel,
        lastDewormingDate: options?.lastDewormingDate,
        lastVaccinationDate: options?.lastVaccinationDate,
        lastRabiesDate: options?.lastRabiesDate,
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
    void pc.cancelDailyRoutineNotificationsForPet(id).catch(() => {});

    await getPetCoordinationPorts().resyncHealthRecordsAfterPetRemoval(
      nextActive?.id,
    );

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

  getLastHealthMilestones: async (petId: string) => {
    try {
      return await getPetCoordinationPorts().getLastHealthMilestones(petId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[petStore] getLastHealthMilestones error', error);
      return {};
    }
  },

  pickPetPhoto: async source => {
    return pc.pickPetPhoto(source);
  },

  preparePetPhoto: async request => {
    return pc.preparePetPhoto.execute(request);
  },

  buildHealthCardViewModel: async petId => {
    const userId = requireUserId();
    if (!userId) {
      throw new Error('Please sign in again.');
    }
    return pc.buildPetHealthCard(userId, petId);
  },
}));
