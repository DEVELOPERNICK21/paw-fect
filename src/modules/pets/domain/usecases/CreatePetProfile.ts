import type {
  Pet,
  PetGender,
  PetLifestyleRiskLevel,
  PetLifestyleType,
  PetRegion,
  PetType,
} from '../models/Pet';
import { createLocalId } from '../../../../shared/utils/id';

export interface CreatePetProfileInput {
  userId: string;
  name: string;
  type: PetType;
  breed?: string;
  gender?: PetGender;
  dob?: string;
  lifestyle?: {
    type: PetLifestyleType;
    riskLevel: PetLifestyleRiskLevel;
  };
  region?: PetRegion;
  photo?: string;
}

export type CreatePetProfileResult =
  | { ok: false; errorMessage: string }
  | { ok: true; pet: Pet };

export class CreatePetProfile {
  execute(input: CreatePetProfileInput): CreatePetProfileResult {
    if (!input.userId?.trim()) {
      return { ok: false, errorMessage: 'Please sign in again to add a pet.' };
    }

    const name = input.name.trim();
    if (!name) {
      return { ok: false, errorMessage: 'Pet name is required.' };
    }

    const now = new Date().toISOString();
    return {
      ok: true,
      pet: {
        id: createLocalId('pet'),
        userId: input.userId,
        name,
        type: input.type,
        breed: input.breed?.trim() || undefined,
        gender: input.gender,
        dob: input.dob,
        lifestyle: input.lifestyle ?? { type: 'indoor', riskLevel: 'low' },
        region: input.region ?? 'OTHER',
        photo: input.photo || undefined,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      },
    };
  }
}
