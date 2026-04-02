import { storageService } from '../../../../infrastructure/storage/storageService';
import type { DewormingSymptom } from '../../domain/utils/DewormingEngine';

export interface DewormingPetState {
  completionDates: string[];
  hasPreviousDeworming?: boolean;
  lastDewormingUnknown?: boolean;
  lastDewormingDate?: string | null;
  symptoms?: DewormingSymptom[];
}

const defaultState = (): DewormingPetState => ({
  completionDates: [],
});

const key = (userId: string, petId: string): string =>
  `dewormingState:${userId}:${petId}`;

export interface DewormingLocalDataSource {
  getState(userId: string, petId: string): Promise<DewormingPetState>;
  setState(userId: string, petId: string, state: DewormingPetState): Promise<void>;
  removeState(userId: string, petId: string): Promise<void>;
}

class DewormingLocalDataSourceImpl implements DewormingLocalDataSource {
  async getState(userId: string, petId: string): Promise<DewormingPetState> {
    const raw = await storageService.getItem<unknown>(key(userId, petId));
    if (raw === null || typeof raw !== 'object') {
      return defaultState();
    }
    const o = raw as Record<string, unknown>;
    const completions = o.completionDates;
    const completionDates = Array.isArray(completions)
      ? completions.filter((d): d is string => typeof d === 'string')
      : [];
    const symptoms = o.symptoms;
    const parsedSymptoms = Array.isArray(symptoms)
      ? symptoms.filter((s): s is DewormingSymptom =>
          typeof s === 'string' &&
          ['diarrhea', 'vomiting', 'bloated_belly', 'worms_visible'].includes(s),
        )
      : undefined;
    return {
      completionDates,
      hasPreviousDeworming:
        typeof o.hasPreviousDeworming === 'boolean'
          ? o.hasPreviousDeworming
          : undefined,
      lastDewormingUnknown:
        typeof o.lastDewormingUnknown === 'boolean'
          ? o.lastDewormingUnknown
          : undefined,
      lastDewormingDate:
        typeof o.lastDewormingDate === 'string' ? o.lastDewormingDate : null,
      symptoms: parsedSymptoms,
    };
  }

  async setState(
    userId: string,
    petId: string,
    state: DewormingPetState,
  ): Promise<void> {
    await storageService.setItem(key(userId, petId), state);
  }

  async removeState(userId: string, petId: string): Promise<void> {
    await storageService.removeItem(key(userId, petId));
  }
}

export const createDewormingLocalDataSource = (): DewormingLocalDataSource =>
  new DewormingLocalDataSourceImpl();
