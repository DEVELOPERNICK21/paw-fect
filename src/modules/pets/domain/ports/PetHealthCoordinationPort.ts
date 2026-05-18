import type {
  PetLifestyleRiskLevel,
  PetLifestyleType,
  PetRegion,
  PetType,
} from '../models/Pet';

/**
 * Pets → smart-health coordination payload (mirrors records bootstrap input minus userId).
 * Keeps petStore free of imports from the records module.
 */
export interface PetHealthBootstrapParams {
  petId: string;
  petType: PetType;
  dateOfBirth: string;
  region?: PetRegion;
  lifestyleType?: PetLifestyleType;
  lifestyleRiskLevel?: PetLifestyleRiskLevel;
  lastVaccinationDate?: string;
  lastRabiesDate?: string;
  lastDewormingDate?: string;
}

/**
 * Domain-level result of last health milestones for a pet.
 * Returned to the pets feature so its UI never inspects records-feature data shapes.
 */
export interface PetHealthMilestones {
  lastDewormingDate?: string;
  lastVaccinationDate?: string;
  lastRabiesDate?: string;
}
