export type PetSpecies = 'dog' | 'cat';

export type PetSize = 'small' | 'medium' | 'large' | 'giant';

export type PetLifestyle = 'indoor' | 'outdoor' | 'mixed';

export type PetEnergyLevel = 'low' | 'medium' | 'high';

export type PetAgeStage = 'puppy' | 'junior' | 'adult' | 'senior';

export type PetCoatType = 'short' | 'medium' | 'long' | 'double';

export interface PetSchedulePreferences {
  ownerWakeTime: string;
  ownerSleepTime: string;
  ownerWorkHours: {
    start: string;
    end: string;
  } | null;
  hasDogWalker: boolean;
  feedingPortionGrams: number | null;
  feedingType: 'dry' | 'wet' | 'mixed';
}

export interface PetProfile {
  id: string;
  name: string;
  dob: string;
  species: PetSpecies;
  breed?: string;
  size?: PetSize;
  lifestyle: PetLifestyle;
  energyLevel: PetEnergyLevel;
  coatType?: PetCoatType;
}
