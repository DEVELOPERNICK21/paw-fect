import type { PetHealthMilestones } from '../ports/PetHealthCoordinationPort';
import type {
  Pet,
  PetGender,
  PetLifestyleRiskLevel,
  PetLifestyleType,
  PetRegion,
  PetType,
} from '../models/Pet';

export type PetFormSnapshot = {
  name: string;
  petType: PetType;
  breed: string;
  dob: string;
  gender: PetGender | '';
  lifestyleType: PetLifestyleType;
  lifestyleRiskLevel: PetLifestyleRiskLevel;
  region: PetRegion;
  photoKey: string;
  hasPreviousDeworming: boolean;
  lastDewormingDate: string;
  lastDewormingUnknown: boolean;
  hasPreviousVaccination: boolean;
  lastVaccinationDate: string;
  lastVaccinationUnknown: boolean;
  hasPreviousRabies: boolean;
  lastRabiesDate: string;
  lastRabiesUnknown: boolean;
};

export type PetFormSnapshotInput = PetFormSnapshot;

export function createPetFormSnapshot(
  input: PetFormSnapshotInput,
): PetFormSnapshot {
  return {
    name: input.name.trim(),
    petType: input.petType,
    breed: input.breed.trim(),
    dob: input.dob.trim(),
    gender: input.gender,
    lifestyleType: input.lifestyleType,
    lifestyleRiskLevel: input.lifestyleRiskLevel,
    region: input.region,
    photoKey: input.photoKey,
    hasPreviousDeworming: input.hasPreviousDeworming,
    lastDewormingDate: input.lastDewormingDate.trim(),
    lastDewormingUnknown: input.lastDewormingUnknown,
    hasPreviousVaccination: input.hasPreviousVaccination,
    lastVaccinationDate: input.lastVaccinationDate.trim(),
    lastVaccinationUnknown: input.lastVaccinationUnknown,
    hasPreviousRabies: input.hasPreviousRabies,
    lastRabiesDate: input.lastRabiesDate.trim(),
    lastRabiesUnknown: input.lastRabiesUnknown,
  };
}

export function petFormSnapshotsEqual(
  a: PetFormSnapshot,
  b: PetFormSnapshot,
): boolean {
  const keys = Object.keys(a) as Array<keyof PetFormSnapshot>;
  return keys.every(key => a[key] === b[key]);
}

export function petFormPhotoKey(input: {
  pendingLocalUri?: string | null;
  photoCleared: boolean;
  photoUri: string;
}): string {
  if (input.pendingLocalUri) {
    return `pending:${input.pendingLocalUri}`;
  }
  if (input.photoCleared) {
    return 'cleared';
  }
  const uri = input.photoUri.trim();
  return uri.length > 0 ? `uri:${uri}` : 'none';
}

export function snapshotFromPetAndMilestones(
  pet: Pet,
  milestones: PetHealthMilestones,
): PetFormSnapshot {
  return createPetFormSnapshot({
    name: pet.name,
    petType: pet.type,
    breed: pet.breed ?? '',
    dob: pet.dob ?? '',
    gender: pet.gender ?? '',
    lifestyleType: pet.lifestyle?.type ?? 'indoor',
    lifestyleRiskLevel: pet.lifestyle?.riskLevel ?? 'low',
    region: pet.region ?? 'OTHER',
    photoKey: petFormPhotoKey({
      pendingLocalUri: null,
      photoCleared: false,
      photoUri: pet.photo ?? '',
    }),
    hasPreviousDeworming: Boolean(milestones.lastDewormingDate),
    lastDewormingDate: milestones.lastDewormingDate ?? '',
    lastDewormingUnknown: false,
    hasPreviousVaccination: Boolean(milestones.lastVaccinationDate),
    lastVaccinationDate: milestones.lastVaccinationDate ?? '',
    lastVaccinationUnknown: false,
    hasPreviousRabies: Boolean(milestones.lastRabiesDate),
    lastRabiesDate: milestones.lastRabiesDate ?? '',
    lastRabiesUnknown: false,
  });
}
