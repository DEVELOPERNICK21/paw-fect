import { create } from 'zustand';

import { useAuthStore } from '../../auth/store/authStore';
import { usePetStore } from '../../pets/store/petStore';
import { createDewormingLocalDataSource } from '../data/datasources/DewormingLocalDataSource';
import type { DewormingPetState } from '../data/datasources/DewormingLocalDataSource';
import type {
  DewormingInput,
  DewormingResult,
  DewormingSymptom,
} from '../domain/utils/DewormingEngine';
import { dewormingEngine } from '../domain/utils/DewormingEngine';
import type { Pet } from '../../pets/domain/models/Pet';

const dewormingLocal = createDewormingLocalDataSource();

function requireUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

const buildInputFromPet = (
  pet: Pet,
  local: DewormingPetState,
  todayDate: string,
): DewormingInput => ({
  petType: pet.type,
  dateOfBirth: pet.dob ?? todayDate,
  lifestyle: pet.lifestyle?.type ?? 'indoor',
  hasPreviousDeworming: local.hasPreviousDeworming,
  lastDewormingUnknown: local.lastDewormingUnknown,
  lastDewormingDate: local.lastDewormingDate ?? undefined,
  completionDates: local.completionDates,
  symptoms: local.symptoms,
  todayDate,
});

interface DewormingState {
  result: DewormingResult | null;
  loading: boolean;
  error: string | null;
  petState: DewormingPetState | null;
  activePetId: string | null;
  lastTodayDate: string | null;
  hydrateAndGenerate: (pet: Pet) => Promise<void>;
  logCompletion: (completedDate: string) => Promise<void>;
  updateLocalState: (
    petId: string,
    partial: Partial<DewormingPetState>,
  ) => Promise<void>;
  persistSymptoms: (symptoms: DewormingSymptom[]) => Promise<void>;
  reset: () => void;
}

export const useDewormingStore = create<DewormingState>((set, get) => ({
  result: null,
  loading: false,
  error: null,
  petState: null,
  activePetId: null,
  lastTodayDate: null,

  hydrateAndGenerate: async (pet: Pet) => {
    const userId = requireUserId();
    if (!userId || !pet.dob) {
      set({
        result: null,
        loading: false,
        error: null,
        petState: null,
        activePetId: pet.id,
        lastTodayDate: null,
      });
      return;
    }

    set({ loading: true, error: null, activePetId: pet.id });
    try {
      const local = await dewormingLocal.getState(userId, pet.id);
      const todayDate = new Date().toISOString().slice(0, 10);
      const input = buildInputFromPet(pet, local, todayDate);
      const result = dewormingEngine.execute(input);
      set({
        result,
        loading: false,
        petState: local,
        lastTodayDate: todayDate,
        error: null,
      });
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : 'Failed to generate schedule',
        loading: false,
      });
    }
  },

  logCompletion: async (completedDate: string) => {
    const userId = requireUserId();
    const pet = usePetStore.getState().activePet;
    if (!userId || !pet?.dob) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const only = toIsoDateOnly(completedDate);
      const prev = await dewormingLocal.getState(userId, pet.id);
      const nextDates = [...new Set([...prev.completionDates, only])].sort(
        (a, b) => a.localeCompare(b),
      );
      const nextState: DewormingPetState = {
        ...prev,
        completionDates: nextDates,
      };
      await dewormingLocal.setState(userId, pet.id, nextState);

      const todayDate = new Date().toISOString().slice(0, 10);
      const input = buildInputFromPet(pet, nextState, todayDate);
      const result = dewormingEngine.execute(input);
      set({
        result,
        loading: false,
        petState: nextState,
        lastTodayDate: todayDate,
        error: null,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update schedule',
        loading: false,
      });
    }
  },

  updateLocalState: async (
    petId: string,
    partial: Partial<DewormingPetState>,
  ) => {
    const userId = requireUserId();
    if (!userId) {
      return;
    }
    const prev = await dewormingLocal.getState(userId, petId);
    const next: DewormingPetState = {
      ...prev,
      ...partial,
      completionDates: partial.completionDates ?? prev.completionDates,
    };
    await dewormingLocal.setState(userId, petId, next);
    const { activePetId } = get();
    if (activePetId === petId) {
      set({ petState: next });
    }
  },

  persistSymptoms: async (symptoms: DewormingSymptom[]) => {
    const userId = requireUserId();
    const pet = usePetStore.getState().activePet;
    if (!userId || !pet?.dob) {
      return;
    }
    const prev = await dewormingLocal.getState(userId, pet.id);
    const next: DewormingPetState = { ...prev, symptoms };
    await dewormingLocal.setState(userId, pet.id, next);
    const todayDate = new Date().toISOString().slice(0, 10);
    const input = buildInputFromPet(pet, next, todayDate);
    const result = dewormingEngine.execute(input);
    set({
      result,
      petState: next,
      lastTodayDate: todayDate,
      error: null,
    });
  },

  reset: () => {
    set({
      result: null,
      loading: false,
      error: null,
      petState: null,
      activePetId: null,
      lastTodayDate: null,
    });
  },
}));

const toIsoDateOnly = (value: string): string => value.slice(0, 10);

/** Save onboarding answers and optionally merge into current pet state (call after pet is created). */
export const saveDewormingOnboardingForPet = async (
  userId: string,
  petId: string,
  data: {
    hasPreviousDeworming: boolean;
    lastDewormingDate?: string | null;
    lastDewormingUnknown?: boolean;
  },
): Promise<void> => {
  const prev = await dewormingLocal.getState(userId, petId);
  const next: DewormingPetState = {
    ...prev,
    hasPreviousDeworming: data.hasPreviousDeworming,
    lastDewormingDate: data.lastDewormingUnknown
      ? null
      : data.lastDewormingDate ?? null,
    lastDewormingUnknown: data.lastDewormingUnknown ?? false,
  };
  await dewormingLocal.setState(userId, petId, next);
};

export const getDewormingLocalDataSource = (): ReturnType<
  typeof createDewormingLocalDataSource
> => dewormingLocal;
